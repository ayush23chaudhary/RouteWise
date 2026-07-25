import unittest
import uuid
from datetime import date, datetime, timezone

from domain.entities.schedule_event import ScheduleEvent
from domain.services.log_generator import ELDLogGenerator
from domain.value_objects.coordinates import Coordinates


class TestELDLogGenerator(unittest.TestCase):
    def setUp(self):
        self.generator = ELDLogGenerator()
        self.sf = Coordinates(37.7749, -122.4194)

    def test_midnight_splitting_and_log_generation(self):
        # Create an event spanning across midnight (Day 1 20:00 to Day 2 06:00 = 10 hours OFF)
        t_start = datetime(2026, 7, 24, 20, 0, 0, tzinfo=timezone.utc)
        t_end = datetime(2026, 7, 25, 6, 0, 0, tzinfo=timezone.utc)

        event = ScheduleEvent(
            id=uuid.uuid4(),
            sequence=1,
            event_type="DAILY_RESET",
            duty_status="OFF",
            start_time=t_start,
            end_time=t_end,
            start_coordinates=self.sf,
            end_coordinates=self.sf,
        )

        daily_logs = self.generator.generate_daily_logs([event])

        self.assertEqual(len(daily_logs), 2)
        self.assertEqual(daily_logs[0].log_date, date(2026, 7, 24))
        self.assertEqual(daily_logs[1].log_date, date(2026, 7, 25))

        # Day 1 should have 4 hours (14,400s) OFF
        self.assertEqual(daily_logs[0].off_duty_seconds, 14400)

        # Day 2 should have 6 hours (21,600s) OFF
        self.assertEqual(daily_logs[1].off_duty_seconds, 21600)

        # Each log grid must contain 96 interval items
        self.assertEqual(len(daily_logs[0].grid_intervals), 96)
        self.assertEqual(len(daily_logs[1].grid_intervals), 96)

    def test_96_grid_interval_duty_assignment(self):
        # 1-hour driving segment from 08:00 to 09:00 on Day 1
        t_start = datetime(2026, 7, 24, 8, 0, 0, tzinfo=timezone.utc)
        t_end = datetime(2026, 7, 24, 9, 0, 0, tzinfo=timezone.utc)

        event = ScheduleEvent(
            id=uuid.uuid4(),
            sequence=1,
            event_type="DRIVE",
            duty_status="D",
            start_time=t_start,
            end_time=t_end,
            start_coordinates=self.sf,
            end_coordinates=self.sf,
        )

        daily_logs = self.generator.generate_daily_logs([event])
        self.assertEqual(len(daily_logs), 1)
        grid = daily_logs[0].grid_intervals

        # 08:00 to 09:00 corresponds to intervals 32, 33, 34, 35 (4 * 15m intervals)
        self.assertEqual(grid[32], "D")
        self.assertEqual(grid[33], "D")
        self.assertEqual(grid[34], "D")
        self.assertEqual(grid[35], "D")
        self.assertEqual(grid[0], "OFF")  # Midnight interval is OFF

if __name__ == "__main__":
    unittest.main()
