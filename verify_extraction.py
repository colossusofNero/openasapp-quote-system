#!/usr/bin/env python3
"""Verify the extracted JSON files."""

import json
from pathlib import Path

OUTPUT_DIR = r"src\data\lookups"

files = {
    'cost-basis-factors.json': 12,
    'zip-code-factors.json': 12,
    'sqft-factors.json': 12,
    'acres-factors.json': 12,
    'property-type-factors.json': 10,
    'floor-factors.json': 12,
    'multiple-properties-factors.json': 7,
    'property-types.json': 10
}

print("="*70)
print("EXTRACTION VERIFICATION REPORT")
print("="*70)

all_passed = True
total_records = 0

for filename, expected_count in files.items():
    filepath = Path(OUTPUT_DIR) / filename

    if not filepath.exists():
        print(f"❌ {filename}: FILE NOT FOUND")
        all_passed = False
        continue

    with open(filepath, 'r') as f:
        data = json.load(f)

    actual_count = len(data)
    total_records += actual_count

    status = "[OK]" if actual_count == expected_count else "[FAIL]"

    if actual_count == expected_count:
        print(f"{status} {filename:40s} {actual_count:3d} records")
    else:
        print(f"{status} {filename:40s} {actual_count:3d} records (EXPECTED {expected_count})")
        all_passed = False

print("="*70)
print(f"Total Records: {total_records} (expected 87)")
print("="*70)

if all_passed and total_records == 87:
    print("\n*** ALL CHECKS PASSED ***")
    print("\nExtraction successful! All tables have been correctly extracted.")
else:
    print("\n*** SOME CHECKS FAILED ***")
    print("\nPlease review the extraction process.")

print("\nOutput directory:", Path(OUTPUT_DIR).absolute())
