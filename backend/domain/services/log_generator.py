import uuid
from datetime import date, datetime, time, timedelta, timezone

from domain.entities.daily_log import DailyLog
from domain.entities.schedule_event import ScheduleEvent


class ELDLogGenerator:
    """
    Pure Domain ELD Log Generator.
    Splits multi-day continuous trip event timelines across midnight (00:00:00) boundaries,
    calculates daily totals for OFF, SB, D, and ON duty statuses, and generates 96-point 
    15-minute grid status arrays per 24-hour log page.
    """
    def generate_daily_logs(self, events: list[ScheduleEvent]) -> list[DailyLog]:
        """
        Transforms a continuous list of ScheduleEvents into an ordered list of DailyLog domain objects.
        """
        if not events:
            return []

        # 1. Split events across midnight boundaries
        split_events = self._split_events_by_midnight(events)

        # 2. Group split events by calendar date
        daily_event_groups: dict[date, list[dict]] = {}
        for ev in split_events:
            d = ev["start_time"].date()
            if d not in daily_event_groups:
                daily_event_groups[d] = []
            daily_event_groups[d].append(ev)

        # 3. Build DailyLog aggregate per date
        daily_logs: list[DailyLog] = []
        sorted_dates = sorted(daily_event_groups.keys())

        for d in sorted_dates:
            day_events = daily_event_groups[d]

            off_secs = 0
            sb_secs = 0
            d_secs = 0
            on_secs = 0

            for ev in day_events:
                dur = int((ev["end_time"] - ev["start_time"]).total_seconds())
                status = ev["duty_status"]
                if status == "OFF":
                    off_secs += dur
                elif status == "SB":
                    sb_secs += dur
                elif status == "D":
                    d_secs += dur
                elif status == "ON":
                    on_secs += dur

            # Generate 96 15-minute interval grid array
            grid_data = self._generate_96_grid_intervals(d, day_events)

            log_entry = DailyLog(
                id=uuid.uuid4(),
                log_date=d,
                off_duty_seconds=off_secs,
                sleeper_berth_seconds=sb_secs,
                driving_seconds=d_secs,
                on_duty_seconds=on_secs,
                grid_intervals=grid_data,
            )
            daily_logs.append(log_entry)

        return daily_logs

    def _split_events_by_midnight(self, events: list[ScheduleEvent]) -> list[dict]:
        """
        Splits events overlapping midnight (00:00:00) into date-partitioned event fragments.
        """
        split_list: list[dict] = []

        for ev in events:
            curr_start = ev.start_time
            end_time = ev.end_time

            while curr_start < end_time:
                # Calculate midnight boundary for current date
                next_midnight = datetime.combine(
                    curr_start.date() + timedelta(days=1),
                    time(0, 0, 0),
                    tzinfo=curr_start.tzinfo or timezone.utc,
                )

                if end_time <= next_midnight:
                    # Event completes on same calendar day
                    split_list.append({
                        "duty_status": ev.duty_status,
                        "event_type": ev.event_type,
                        "start_time": curr_start,
                        "end_time": end_time,
                    })
                    break
                else:
                    # Event crosses midnight -> split at 23:59:59 / 00:00:00 boundary
                    split_list.append({
                        "duty_status": ev.duty_status,
                        "event_type": ev.event_type,
                        "start_time": curr_start,
                        "end_time": next_midnight,
                    })
                    curr_start = next_midnight

        return split_list

    def _generate_96_grid_intervals(self, log_date: date, day_events: list[dict]) -> list[str]:
        """
        Generates 96 15-minute interval status strings (OFF, SB, D, ON) per 24-hour log page.
        """
        grid = ["OFF"] * 96

        for i in range(96):
            # Calculate 15-minute window bounds
            window_start = datetime.combine(log_date, time(0, 0, 0), tzinfo=timezone.utc) + timedelta(minutes=i * 15)
            window_end = window_start + timedelta(minutes=15)

            # Match event overlapping window mid-point
            mid_point = window_start + timedelta(minutes=7, seconds=30)
            status_match = "OFF"

            for ev in day_events:
                if ev["start_time"] <= mid_point < ev["end_time"]:
                    status_match = ev["duty_status"]
                    break

            grid[i] = status_match

        return grid
