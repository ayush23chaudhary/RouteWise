from datetime import timedelta, timezone

from domain.entities.trip import Trip
from domain.interfaces.scheduler import ISchedulingEngine
from domain.services.log_generator import ELDLogGenerator
from domain.services.timeline_engine import TimelineEngine
from domain.value_objects.coordinates import Coordinates


class HOSSchedulingEngine(ISchedulingEngine):
    """
    Production-grade FMCSA HOS Scheduling Engine implementing 49 CFR Part 395 rules.
    Calculates compliant driving segments, rest breaks, fuel stops, 10-hour daily resets,
    34-hour cycle restarts, and 24-hour ELD daily logs.
    """
    MAX_DRIVE_SECONDS_PER_SHIFT = 39600   # 11.0 Hours
    MAX_DUTY_SECONDS_PER_SHIFT = 50400    # 14.0 Hours
    MAX_DRIVE_BEFORE_BREAK = 28800         # 8.0 Hours
    MAX_CYCLE_SECONDS = 252000            # 70.0 Hours
    REST_BREAK_SECONDS = 1800             # 30 Minutes
    DAILY_RESET_SECONDS = 36000           # 10.0 Hours
    RESTART_34H_SECONDS = 122400          # 34.0 Hours
    PRE_TRIP_SECONDS = 1800               # 30 Minutes
    DWELL_EVENT_SECONDS = 3600            # 1.0 Hour (Pickup/Dropoff)
    FUEL_STOP_SECONDS = 1800              # 30 Minutes
    MAX_FUEL_INTERVAL_MILES = 1000.0      # 1,000 Miles
    DEFAULT_SPEED_MPH = 50.0              # 50 mph average truck velocity

    def generate_schedule(self, trip: Trip) -> Trip:
        """
        Executes the iterative HOS scheduling algorithm over the trip route polyline.
        Appends compliant events to the trip's timeline, generates 24-hour ELD daily logs,
        and updates aggregate properties.
        """
        timeline = TimelineEngine()
        current_time = trip.start_time if trip.start_time.tzinfo else trip.start_time.replace(tzinfo=timezone.utc)

        waypoints = trip.waypoints
        origin_wp = waypoints[0] if waypoints else None
        pickup_wp = waypoints[1] if len(waypoints) > 1 else None
        dropoff_wp = waypoints[-1] if len(waypoints) > 2 else None

        origin_coords = origin_wp.coordinates if origin_wp else Coordinates(37.7749, -122.4194)
        pickup_coords = pickup_wp.coordinates if pickup_wp else origin_coords
        dropoff_coords = dropoff_wp.coordinates if dropoff_wp else pickup_coords

        t_drive = 0
        t_duty = 0
        t_break_drive = 0
        t_cycle = trip.initial_hos_state.cycle_seconds_used
        d_fuel = 0.0

        if t_cycle >= self.MAX_CYCLE_SECONDS:
            t_next = current_time + timedelta(seconds=self.RESTART_34H_SECONDS)
            timeline.append_event(
                event_type="RESTART_34H",
                duty_status="OFF",
                start_time=current_time,
                end_time=t_next,
                start_coordinates=origin_coords,
                end_coordinates=origin_coords,
                description="34-Hour Cycle Restart (Initial Limit Exceeded)",
            )
            current_time = t_next
            t_cycle = 0
            t_drive = 0
            t_duty = 0
            t_break_drive = 0

        # Pre-Trip Inspection Event
        t_next = current_time + timedelta(seconds=self.PRE_TRIP_SECONDS)
        timeline.append_event(
            event_type="PRE_TRIP",
            duty_status="ON",
            start_time=current_time,
            end_time=t_next,
            start_coordinates=origin_coords,
            end_coordinates=origin_coords,
            description="Pre-Trip Inspection",
        )
        current_time = t_next
        t_duty += self.PRE_TRIP_SECONDS
        t_cycle += self.PRE_TRIP_SECONDS

        # Pickup Loading Event
        t_next = current_time + timedelta(seconds=self.DWELL_EVENT_SECONDS)
        timeline.append_event(
            event_type="PICKUP",
            duty_status="ON",
            start_time=current_time,
            end_time=t_next,
            start_coordinates=pickup_coords,
            end_coordinates=pickup_coords,
            description="Pickup Loading Dwell",
        )
        current_time = t_next
        t_duty += self.DWELL_EVENT_SECONDS
        t_cycle += self.DWELL_EVENT_SECONDS

        # Driving Transit Simulation Loop
        remaining_distance = trip.total_distance_miles
        current_coords = pickup_coords

        while remaining_distance > 0.001:
            if t_cycle >= self.MAX_CYCLE_SECONDS:
                t_next = current_time + timedelta(seconds=self.RESTART_34H_SECONDS)
                timeline.append_event(
                    event_type="RESTART_34H",
                    duty_status="OFF",
                    start_time=current_time,
                    end_time=t_next,
                    start_coordinates=current_coords,
                    end_coordinates=current_coords,
                    description="34-Hour Cycle Restart",
                )
                current_time = t_next
                t_cycle = 0
                t_drive = 0
                t_duty = 0
                t_break_drive = 0
                continue

            if t_drive >= self.MAX_DRIVE_SECONDS_PER_SHIFT or t_duty >= self.MAX_DUTY_SECONDS_PER_SHIFT:
                t_next = current_time + timedelta(seconds=self.DAILY_RESET_SECONDS)
                timeline.append_event(
                    event_type="DAILY_RESET",
                    duty_status="OFF",
                    start_time=current_time,
                    end_time=t_next,
                    start_coordinates=current_coords,
                    end_coordinates=current_coords,
                    description="10-Hour Daily Off-Duty Reset",
                )
                current_time = t_next
                t_drive = 0
                t_duty = 0
                t_break_drive = 0
                continue

            if t_break_drive >= self.MAX_DRIVE_BEFORE_BREAK:
                t_next = current_time + timedelta(seconds=self.REST_BREAK_SECONDS)
                timeline.append_event(
                    event_type="REST_BREAK",
                    duty_status="OFF",
                    start_time=current_time,
                    end_time=t_next,
                    start_coordinates=current_coords,
                    end_coordinates=current_coords,
                    description="30-Minute Mandatory Rest Break",
                )
                current_time = t_next
                t_duty += self.REST_BREAK_SECONDS
                t_break_drive = 0
                continue

            if d_fuel >= self.MAX_FUEL_INTERVAL_MILES:
                t_next = current_time + timedelta(seconds=self.FUEL_STOP_SECONDS)
                timeline.append_event(
                    event_type="FUEL_STOP",
                    duty_status="ON",
                    start_time=current_time,
                    end_time=t_next,
                    start_coordinates=current_coords,
                    end_coordinates=current_coords,
                    description="30-Minute Refueling Stop",
                )
                current_time = t_next
                t_duty += self.FUEL_STOP_SECONDS
                t_cycle += self.FUEL_STOP_SECONDS
                d_fuel = 0.0
                continue

            max_drive_seconds = min(
                self.MAX_DRIVE_SECONDS_PER_SHIFT - t_drive,
                self.MAX_DUTY_SECONDS_PER_SHIFT - t_duty,
                self.MAX_DRIVE_BEFORE_BREAK - t_break_drive,
                self.MAX_CYCLE_SECONDS - t_cycle,
                int(((self.MAX_FUEL_INTERVAL_MILES - d_fuel) / self.DEFAULT_SPEED_MPH) * 3600),
            )

            remaining_seconds = int((remaining_distance / self.DEFAULT_SPEED_MPH) * 3600)
            drive_seconds = max(1, min(max_drive_seconds, remaining_seconds))
            drive_miles = min(remaining_distance, (drive_seconds / 3600.0) * self.DEFAULT_SPEED_MPH)

            ratio = min(1.0, drive_miles / max(0.001, remaining_distance))
            next_lat = current_coords.latitude + ratio * (dropoff_coords.latitude - current_coords.latitude)
            next_lon = current_coords.longitude + ratio * (dropoff_coords.longitude - current_coords.longitude)
            next_coords = Coordinates(next_lat, next_lon)

            t_next = current_time + timedelta(seconds=drive_seconds)
            timeline.append_event(
                event_type="DRIVE",
                duty_status="D",
                start_time=current_time,
                end_time=t_next,
                start_coordinates=current_coords,
                end_coordinates=next_coords,
                distance_miles=round(drive_miles, 2),
                description=f"Driving segment ({drive_miles:.1f} miles)",
            )

            current_time = t_next
            current_coords = next_coords
            t_drive += drive_seconds
            t_duty += drive_seconds
            t_break_drive += drive_seconds
            t_cycle += drive_seconds
            d_fuel += drive_miles
            remaining_distance -= drive_miles

        # Dropoff Unloading Event
        t_next = current_time + timedelta(seconds=self.DWELL_EVENT_SECONDS)
        timeline.append_event(
            event_type="DROPOFF",
            duty_status="ON",
            start_time=current_time,
            end_time=t_next,
            start_coordinates=dropoff_coords,
            end_coordinates=dropoff_coords,
            description="Dropoff Unloading Dwell",
        )

        # Attach events and generate 24-hour ELD Daily Logs
        trip.events = timeline.events
        log_gen = ELDLogGenerator()
        trip.daily_logs = log_gen.generate_daily_logs(timeline.events)

        trip.mark_planned()
        return trip
