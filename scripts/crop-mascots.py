"""
Crop Gemini character sprite sheets into individual mascot poses.
Saves to public/images/mascots/
"""
import os
from PIL import Image
import numpy as np

BASE = os.path.join(os.path.dirname(__file__), '..', 'public', 'images')
OUT = os.path.join(BASE, 'mascots')
os.makedirs(OUT, exist_ok=True)

def crop_grid(input_path, rows, cols, names):
    """Crop a grid-layout sprite sheet into individual images."""
    if not os.path.exists(input_path):
        print(f"  SKIP: {input_path} not found")
        return

    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    cell_w, cell_h = w // cols, h // rows
    print(f"  Image: {w}x{h}, grid: {cols}x{rows}, cell: {cell_w}x{cell_h}")

    idx = 0
    for r in range(rows):
        for c in range(cols):
            if idx >= len(names):
                break
            name = names[idx]
            idx += 1
            if not name:
                continue

            box = (c * cell_w, r * cell_h, (c + 1) * cell_w, (r + 1) * cell_h)
            cell = img.crop(box)

            # Detect content by checking non-white/non-transparent pixels
            arr = np.array(cell)
            if arr.shape[2] == 4:
                # Has alpha channel — use it
                mask = arr[:, :, 3] > 10
            else:
                # RGB only — detect non-white
                mask = np.any(arr[:, :, :3] < 240, axis=2)

            if not mask.any():
                print(f"    {name}: empty cell, skipping")
                continue

            rows_with = np.where(mask.any(axis=1))[0]
            cols_with = np.where(mask.any(axis=0))[0]

            pad = 20
            top = max(0, rows_with[0] - pad)
            bottom = min(cell.height, rows_with[-1] + pad)
            left = max(0, cols_with[0] - pad)
            right = min(cell.width, cols_with[-1] + pad)

            cropped = cell.crop((left, top, right, bottom))
            out_path = os.path.join(OUT, name)
            cropped.save(out_path)
            print(f"    {name}: {cropped.width}x{cropped.height}")


# Sheet 1: 3 rows x 4 cols = 12 poses (general poses)
print("\n[Sheet 1] 3czl8z — General poses (3x4)")
crop_grid(
    os.path.join(BASE, 'Gemini_Generated_Image_3czl8z3czl8z3czl.png'),
    rows=3, cols=4,
    names=[
        'sleeping.png', 'laptop.png', 'magnifying-glass.png', 'scientist.png',
        'mechanic.png', 'butterfly-net.png', 'reading.png', 'confetti.png',
        'lightbulb.png', 'thumbs-up.png', 'waving.png', 'clipboard-checklist.png',
    ]
)

# Sheet 2: 3 rows x 4 cols = 12 sport poses
print("\n[Sheet 2] 8y5n0k — Sport poses (3x4)")
crop_grid(
    os.path.join(BASE, 'Gemini_Generated_Image_8y5n0k8y5n0k8y5n.png'),
    rows=3, cols=4,
    names=[
        'sport-football.png', 'sport-soccer.png', 'sport-baseball.png', 'sport-tennis.png',
        'sport-swimming.png', 'sport-volleyball.png', 'sport-lacrosse.png', 'sport-basketball.png',
        'sport-hockey.png', 'sport-martial-arts.png', 'sport-cycling.png', 'sport-track.png',
    ]
)

# Sheet 3: 4 rows x 3 cols = 12 duo poses
print("\n[Sheet 3] vfb387 — Duo poses (4x3)")
crop_grid(
    os.path.join(BASE, 'Gemini_Generated_Image_vfb387vfb387vfb3.png'),
    rows=4, cols=3,
    names=[
        'duo-fist-bump.png', 'duo-high-five.png', 'duo-hug.png',
        'duo-star-point.png', 'duo-medal.png', 'duo-holding-hands.png',
        'duo-standing.png', 'duo-trophy.png', 'duo-crown.png',
        'duo-wave.png', 'duo-piggyback.png', 'duo-pinky-promise.png',
    ]
)

# Sheet 4: 4 rows x 4 cols = 16 family groups
print("\n[Sheet 4] hbn7wl — Family groups (4x4)")
crop_grid(
    os.path.join(BASE, 'Gemini_Generated_Image_hbn7wlhbn7wlhbn7.png'),
    rows=4, cols=4,
    names=[
        'family-football.png', 'family-volleyball.png', 'family-soccer.png', 'family-basketball.png',
        'family-football-2.png', 'family-volleyball-2.png', 'family-soccer-2.png', 'family-basketball-2.png',
        'family-football-3.png', 'family-volleyball-3.png', 'family-soccer-3.png', 'family-basketball-3.png',
        'family-football-4.png', 'family-volleyball-4.png', 'family-soccer-4.png', 'family-basketball-4.png',
    ]
)

# Sheet 5: xytlb6
print("\n[Sheet 5] xytlb6 — Extra poses")
crop_grid(
    os.path.join(BASE, 'Gemini_Generated_Image_xytlb6xytlb6xytl.png'),
    rows=3, cols=4,
    names=[
        'extra-1.png', 'extra-2.png', 'extra-3.png', 'extra-4.png',
        'extra-5.png', 'extra-6.png', 'extra-7.png', 'extra-8.png',
        'extra-9.png', 'extra-10.png', 'extra-11.png', 'extra-12.png',
    ]
)

# Sheet 6: rto5h4
print("\n[Sheet 6] rto5h4 — Extra poses")
crop_grid(
    os.path.join(BASE, 'Gemini_Generated_Image_rto5h4rto5h4rto5.png'),
    rows=3, cols=4,
    names=[
        'extra-13.png', 'extra-14.png', 'extra-15.png', 'extra-16.png',
        'extra-17.png', 'extra-18.png', 'extra-19.png', 'extra-20.png',
        'extra-21.png', 'extra-22.png', 'extra-23.png', 'extra-24.png',
    ]
)

print(f"\nDone! Check {OUT}")
print(f"Files created: {len(os.listdir(OUT))}")
