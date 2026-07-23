import unittest
import uuid
from datetime import datetime, timedelta, timezone
from domain.services.timeline_engine import TimelineEngine
from domain.value_objects.coordinates import Coordinates

class TestTimelineEngine(unittest.TestCase):
    def setUp(self):
        self.coords_sf = Coordinates(37.7749, -122.4194)
        self.coords_la = Coordinates(34.0522, -118.2437)
        self.start_time = datetime(2026, 7, 24, 8, 0, 0, tzinfo=timezone.utc)

    def test_append_event_success(self):
        engine = TimelineEngine()
        t1 = self.start_time
        t2 = t1 + timedelta(minutes=30)
        t3 = t2 + timedelta(hours=4)

        ev1 = engine.append_event(
            event_type="PRE_TRIP",
            duty_status="ON",
            start_time=t1,
            end_time=t2,
            start_coordinates=self.coords_sf,
            end_coordinates=self.coords_sf,
            description="Pre-Trip Inspection",
        )

        ev2 = engine.append_event(
            event_type="DRIVE",
            duty_status="D",
            start_time=t2,
            end_time=t3,
            start_coordinates=self.coords_sf,
            end_coordinates=self.coords_la,
            distance_miles=200.0,
            description="Driving Segment 1",
        )

        self.assertEqual(len(engine.events), 2)
        self.assertEqual(ev1.sequence, 1)
        self.assertEqual(ev2.sequence, 2)
        self.assertTrue(engine.validate_contiguity())
        self.assertEqual(engine.calculate_total_distance_miles(), 200.0)

    def test_overlapping_event_rejection(self):
        engine = TimelineEngine()
        t1 = self.start_time
        t2 = t1 + timedelta(hours=2)
        t_overlap = t1 + timedelta(hours=1)  # Overlaps with t1->t2

        engine.append_event(
            event_type="PRE_TRIP",
            duty_status="ON",
            start_time=t1,
            end_time=t2,
            start_coordinates=self.coords_sf,
            end_coordinates=self.coords_sf,
        )

        with self.assertRaises(ValueError):
            engine.append_event(
                event_type="DRIVE",
                duty_status="D",
                start_time=t_overlap,
                end_time=t_overlap + timedelta(hours=2),
                start_coordinates=self.coords_sf,
                end_coordinates=self.coords_la,
            )

    def test_gap_detection_rejection(self):
        engine = TimelineEngine()
        t1 = self.start_time
        t2 = t1 + timedelta(hours=2)
        t_gap = t2 + timedelta(minutes=15)  # 15-minute gap

        engine.append_event(
            event_type="PRE_TRIP",
            duty_status="ON",
            start_time=t1,
            end_time=t2,
            start_coordinates=self.coords_sf,
            end_coordinates=self.coords_sf,
        )

        with self.assertRaises(ValueError):
            engine.append_event(
                event_type="DRIVE",
                duty_status="D",
                start_time=t_gap,
                end_time=t_gap + timedelta(hours=2),
                start_coordinates=self.coords_sf,
                end_coordinates=self.coords_la,
            )

    def test_duty_totals_calculation(self):
        engine = TimelineEngine()
        t1 = self.start_time
        t2 = t1 + timedelta(minutes=30)  # 30 mins ON
        t3 = t2 + timedelta(hours=8)     # 8 hours D
        t4 = t3 + timedelta(minutes=30)  # 30 mins OFF

        engine.append_event("PRE_TRIP", "ON", t1, t2, self.coords_sf, self.coords_sf)
        engine.append_event("DRIVE", "D", t2, t3, self.coords_sf, self.coords_la)
        engine.append_event("REST_BREAK", "OFF", t3, t4, self.coords_la, self.coords_la)

        totals = engine.calculate_duty_totals()
        self.assertEqual(totals["ON"], 1800)
        self.assertEqual(totals["D"], 28800)
        self.assertEqual(totals["OFF"], 1800)
        self.assertEqual(totals["SB"], 0)

if __name__ == "__main__":
    unittest.main()
