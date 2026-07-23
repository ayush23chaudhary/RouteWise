from domain.interfaces.validator import IValidationEngine
from domain.entities.trip import Trip
from domain.value_objects.validation_result import ValidationResult

class ComplianceValidationEngine(IValidationEngine):
    """
    Independent Regulatory & Structural Compliance Validation Engine.
    Audits completed trip timelines against FMCSA Part 395 rules and timeline contiguity invariants.
    """
    MAX_DRIVE_SECONDS = 39600   # 11.0 Hours
    MAX_DUTY_SECONDS = 50400    # 14.0 Hours
    MAX_BREAK_DRIVE = 28800     # 8.0 Hours
    MAX_CYCLE_SECONDS = 252000  # 70.0 Hours
    MAX_FUEL_MILES = 1000.0     # 1,000 Miles

    def validate_trip(self, trip: Trip) -> ValidationResult:
        """
        Executes complete compliance audit across trip events.
        Returns ValidationResult containing is_compliant status, violations, and warnings.
        """
        violations: list[str] = []
        warnings: list[str] = []

        events = trip.events
        if not events:
            return ValidationResult(is_compliant=True, violations=[], warnings=["Trip timeline contains no events."])

        # 1. Structural Contiguity & Sequence Monotonicity Validation
        for i in range(len(events)):
            ev = events[i]
            if ev.sequence != i + 1:
                violations.append(f"Event sequence index error at position {i}: expected {i + 1}, got {ev.sequence}.")
            
            if ev.start_time >= ev.end_time:
                violations.append(f"Event {ev.sequence} ({ev.event_type}) has non-positive duration.")

            if i > 0:
                prev_ev = events[i - 1]
                if ev.start_time != prev_ev.end_time:
                    violations.append(
                        f"Timeline contiguity gap/overlap between Event {prev_ev.sequence} "
                        f"(ends {prev_ev.end_time}) and Event {ev.sequence} (starts {ev.start_time})."
                    )

        # 2. HOS Clock Boundary Audit
        t_drive = 0
        t_duty = 0
        t_break_drive = 0
        t_cycle = trip.initial_hos_state.cycle_seconds_used
        d_fuel = 0.0

        for ev in events:
            dur = ev.duration_seconds

            # Handle 34-Hour Restart
            if ev.event_type == "RESTART_34H" or (ev.duty_status in ("OFF", "SB") and dur >= 122400):
                t_cycle = 0
                t_drive = 0
                t_duty = 0
                t_break_drive = 0
                d_fuel = 0.0
                continue

            # Handle 10-Hour Reset
            if ev.event_type == "DAILY_RESET" or (ev.duty_status in ("OFF", "SB") and dur >= 36000):
                t_drive = 0
                t_duty = 0
                t_break_drive = 0
                continue

            # Handle 30-Minute Rest Break
            if ev.event_type == "REST_BREAK" or (ev.duty_status in ("OFF", "SB") and dur >= 1800):
                t_break_drive = 0
                t_duty += dur
                continue

            # Handle Fueling Event
            if ev.event_type == "FUEL_STOP":
                d_fuel = 0.0
                t_duty += dur
                t_cycle += dur
                continue

            # Accumulate Duty & Driving Metrics
            if ev.duty_status == "D":
                t_drive += dur
                t_duty += dur
                t_break_drive += dur
                t_cycle += dur
                d_fuel += ev.distance_miles

                # Validate Driving Limits
                if t_drive > self.MAX_DRIVE_SECONDS:
                    violations.append(
                        f"11-Hour Driving Limit Exceeded at Event {ev.sequence}: accumulated {t_drive / 3600:.2f}h driving."
                    )
                if t_duty > self.MAX_DUTY_SECONDS:
                    violations.append(
                        f"14-Hour Duty Limit Exceeded at Event {ev.sequence}: accumulated {t_duty / 3600:.2f}h duty."
                    )
                if t_break_drive > self.MAX_BREAK_DRIVE:
                    violations.append(
                        f"8-Hour Rest Break Rule Exceeded at Event {ev.sequence}: driven {t_break_drive / 3600:.2f}h without 30m break."
                    )
                if t_cycle > self.MAX_CYCLE_SECONDS:
                    violations.append(
                        f"70-Hour / 8-Day Cycle Limit Exceeded at Event {ev.sequence}: accumulated {t_cycle / 3600:.2f}h cycle."
                    )
                if d_fuel > self.MAX_FUEL_MILES + 0.1:  # 0.1 mile tolerance float
                    violations.append(
                        f"1,000-Mile Fueling Limit Exceeded at Event {ev.sequence}: driven {d_fuel:.1f} miles since refuel."
                    )

            elif ev.duty_status == "ON":
                t_duty += dur
                t_cycle += dur
                if t_duty > self.MAX_DUTY_SECONDS:
                    warnings.append(
                        f"Duty time extended beyond 14 hours during non-driving Event {ev.sequence} ({ev.event_type})."
                    )

        is_compliant = len(violations) == 0
        return ValidationResult(is_compliant=is_compliant, violations=violations, warnings=warnings)
