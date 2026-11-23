import os
import sys
import tempfile
import sqlite3

# Setze temporaeres Testverzeichnis fuer DB
test_dir = tempfile.mkdtemp()
os.environ["DATA_DIR"] = test_dir

# Importiere Endpunkte und Modelle aus main.py
sys.path.insert(0, os.path.dirname(__file__))
from main import (
    init_db,
    Event, add_event, get_events, delete_event,
    Meal, set_meal, get_meals,
    ShoppingItem, add_shopping_item, get_shopping_list, toggle_shopping_item, delete_shopping_item,
    Note, add_note, get_notes, delete_note,
    BucketItem, add_bucket_item, get_bucket_list, toggle_bucket_item, delete_bucket_item,
    Countdown, set_countdown, get_countdown
)

init_db()

def test_events():
    print("[TEST] Events...")
    res = add_event(Event(title="Kinoabend", date="2026-12-01", description="Popcorn mitbringen"))
    event_id = res["id"]
    assert event_id is not None
    events = get_events()
    assert len(events) >= 1
    assert any(e["title"] == "Kinoabend" for e in events)

    delete_event(event_id)
    events = get_events()
    assert not any(e["id"] == event_id for e in events)
    print("  -> Events OK (inkl. Loeschen)")

def test_meals():
    print("[TEST] Meals...")
    set_meal(Meal(day="Montag", meal_name="Pizza"))
    set_meal(Meal(day="Montag", meal_name="Pasta Carbonara"))
    meals = get_meals()
    montag = next((m for m in meals if m["day"] == "Montag"), None)
    assert montag is not None
    assert montag["meal_name"] == "Pasta Carbonara"

    # Leeren testen
    set_meal(Meal(day="Montag", meal_name=""))
    meals = get_meals()
    assert not any(m["day"] == "Montag" for m in meals)
    print("  -> Meals OK (inkl. Leeren)")

def test_shopping():
    print("[TEST] Shopping...")
    item_res = add_shopping_item(ShoppingItem(item="Milch", is_bought=False))
    item_id = item_res["id"]

    toggle_shopping_item(item_id, True)
    items = get_shopping_list()
    item = next((i for i in items if i["id"] == item_id), None)
    assert item is not None
    assert item["is_bought"] is True

    delete_shopping_item(item_id)
    items = get_shopping_list()
    assert not any(i["id"] == item_id for i in items)
    print("  -> Shopping OK")

def test_notes():
    print("[TEST] Notes...")
    note_res = add_note(Note(content="Ich liebe dich!"))
    note_id = note_res["id"]
    notes = get_notes()
    assert any(n["id"] == note_id for n in notes)

    delete_note(note_id)
    notes = get_notes()
    assert not any(n["id"] == note_id for n in notes)
    print("  -> Notes OK")

def test_bucket():
    print("[TEST] Bucket...")
    b_res = add_bucket_item(BucketItem(title="Reise nach Island", is_done=False))
    b_id = b_res["id"]

    toggle_bucket_item(b_id, True)
    items = get_bucket_list()
    item = next((i for i in items if i["id"] == b_id), None)
    assert item is not None
    assert item["is_done"] is True

    delete_bucket_item(b_id)
    items = get_bucket_list()
    assert not any(i["id"] == b_id for i in items)
    print("  -> Bucket OK")

def test_countdown():
    print("[TEST] Countdown...")
    set_countdown(Countdown(title="Jahrestag", target_date="2026-12-24"))
    cd = get_countdown()
    assert cd is not None
    assert cd["title"] == "Jahrestag"
    assert cd["target_date"] == "2026-12-24"
    print("  -> Countdown OK")

if __name__ == "__main__":
    try:
        test_events()
        test_meals()
        test_shopping()
        test_notes()
        test_bucket()
        test_countdown()
        print("\n[SUCCESS] Alle Backend-Funktionen und SQLite-Queries vollstaendig verifiziert!")
    finally:
        import shutil
        shutil.rmtree(test_dir, ignore_errors=True)
