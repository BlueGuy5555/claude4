"""
Render faithful UI previews of RepCam's screens using the *exact* color tokens
from src/theme/themes.ts. These are design previews (not device screenshots),
generated so reviewers can see the two themes and layouts.
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

FONT_DIR = "/usr/share/fonts/truetype/dejavu"
def font(size, bold=False):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)

# --- theme tokens (mirrors src/theme/themes.ts) ---
DARK = dict(background="#0B0B0F", surface="#16161C", surfaceAlt="#20202A", text="#F6F6F8",
            textMuted="#9A9AA6", accent="#FF3B3B", accentSoft="#FF6B6B", onAccent="#FFFFFF",
            border="#2A2A34", track="#26262F", success="#3BD07A")
LIGHT = dict(background="#FFFFFF", surface="#F4F8F4", surfaceAlt="#E9F2EA", text="#0E1A12",
             textMuted="#5C6B60", accent="#16A34A", accentSoft="#22C55E", onAccent="#FFFFFF",
             border="#DBE7DD", track="#E4EFE5", success="#16A34A")

W, H = 460, 940
SCALE = 2

def new_phone(bg):
    img = Image.new("RGB", (W * SCALE, H * SCALE), bg)
    return img, ImageDraw.Draw(img)

def rr(d, box, radius, fill=None, outline=None, width=1):
    box = [c * SCALE for c in box]
    d.rounded_rectangle(box, radius=radius * SCALE, fill=fill, outline=outline, width=width * SCALE)

def text(d, pos, s, f, fill, anchor="la"):
    d.text((pos[0] * SCALE, pos[1] * SCALE), s, font=f, fill=fill, anchor=anchor)

def statusbar(d, t):
    text(d, (28, 20), "9:41", font(15, True), t["text"])
    text(d, (W - 28, 20), "5G  100%", font(13, True), t["textMuted"], anchor="ra")

def stat_tile(d, x, y, w, h, t, label, value, accent=False):
    rr(d, (x, y, x + w, y + h), 16, fill=t["surface"], outline=t["border"])
    text(d, (x + 14, y + 14), value, font(24, True), t["accent"] if accent else t["text"])
    text(d, (x + 14, y + h - 26), label, font(13), t["textMuted"])

def home(t, path, title_kicker="LET'S MOVE"):
    img, d = new_phone(t["background"])
    statusbar(d, t)
    text(d, (28, 54), title_kicker, font(13, True), t["textMuted"])
    text(d, (28, 72), "RepCam", font(34, True), t["text"])
    # stat tiles
    stat_tile(d, 28, 128, 194, 92, t, "Day streak", "5", accent=True)
    text(d, (40, 138), "flame", font(11), t["accent"])
    stat_tile(d, 238, 128, 194, 92, t, "Reps today", "40")
    # auto-detect row
    rr(d, (28, 240, 432, 300), 16, fill=t["surface"], outline=t["border"])
    text(d, (44, 256), "Auto-detect exercise", font(16, True), t["text"])
    text(d, (44, 278), "Let RepCam recognise the movement", font(12), t["textMuted"])
    # toggle (on)
    rr(d, (388, 258, 420, 282), 12, fill=t["accent"])
    d.ellipse([(406) * SCALE, 260 * SCALE, (418) * SCALE, 280 * SCALE], fill=t["onAccent"])
    # exercise grid
    text(d, (28, 320), "Choose an exercise", font(16, True), t["text"])
    exs = [("Push-ups", "chest", False, True), ("Pull-ups", "back", False, False),
           ("Squats", "legs", False, False), ("Deadlifts", "back", True, False),
           ("Lunges", "legs", True, False), ("Curls", "arms", True, False)]
    gx, gy, gw, gh, gap = 28, 348, 128, 84, 10
    for i, (name, muscle, locked, sel) in enumerate(exs):
        col = i % 3
        row = i // 3
        x = gx + col * (gw + gap)
        y = gy + row * (gh + gap)
        rr(d, (x, y, x + gw, y + gh), 14,
           fill=t["surfaceAlt"] if sel else t["surface"],
           outline=t["accent"] if sel else t["border"], width=2 if sel else 1)
        # icon dot
        d.ellipse([(x + 12) * SCALE, (y + 12) * SCALE, (x + 32) * SCALE, (y + 32) * SCALE], fill=t["accent"])
        if locked:
            text(d, (x + gw - 16, y + 12), "L", font(12, True), t["textMuted"], anchor="ma")
        text(d, (x + 12, y + 44), name, font(13, True), t["text"])
        text(d, (x + 12, y + 62), muscle, font(11), t["textMuted"])
    # hint
    text(d, (28, 548), "Keep a straight line head to heels; elbows to ~90.", font(12), t["textMuted"])
    # start button
    rr(d, (28, 576, 432, 632), 16, fill=t["accent"])
    text(d, (W / 2, 604), "Start Push-ups", font(17, True), t["onAccent"], anchor="mm")
    # tab bar
    rr(d, (0, H - 74, W, H), 0, fill=t["surface"])
    d.line([(0, (H - 74) * SCALE), (W * SCALE, (H - 74) * SCALE)], fill=t["border"], width=SCALE)
    for i, lbl in enumerate(["Home", "Progress", "Settings"]):
        cx = W / 6 + i * W / 3
        active = i == 0
        text(d, (cx, H - 40), lbl, font(12, True), t["accent"] if active else t["textMuted"], anchor="mm")
    img.save(path)

def draw_skeleton(d, cx, cy, scale, color, softcolor, elbow_deg):
    # simple standing figure with animated arms; coordinates relative
    def P(x, y):
        return (cx + x * scale, cy + y * scale)
    shoulder_l = P(-18, -40); shoulder_r = P(18, -40)
    hip_l = P(-14, 30); hip_r = P(14, 30)
    knee_l = P(-14, 80); knee_r = P(14, 80)
    ankle_l = P(-14, 128); ankle_r = P(14, 128)
    head = P(0, -70)
    # arms bent by elbow_deg
    elbow_l = P(-34, -10); elbow_r = P(34, -10)
    rad = math.radians(elbow_deg)
    wrist_l = (elbow_l[0] - 30 * scale * math.sin(rad), elbow_l[1] - 30 * scale * math.cos(rad))
    wrist_r = (elbow_r[0] + 30 * scale * math.sin(rad), elbow_r[1] - 30 * scale * math.cos(rad))
    bones = [(shoulder_l, shoulder_r), (shoulder_l, elbow_l), (elbow_l, wrist_l),
             (shoulder_r, elbow_r), (elbow_r, wrist_r), (shoulder_l, hip_l),
             (shoulder_r, hip_r), (hip_l, hip_r), (hip_l, knee_l), (knee_l, ankle_l),
             (hip_r, knee_r), (knee_r, ankle_r)]
    for a, b in bones:
        d.line([(a[0] * SCALE, a[1] * SCALE), (b[0] * SCALE, b[1] * SCALE)], fill=color, width=4 * SCALE)
    pts = [head, shoulder_l, shoulder_r, elbow_l, elbow_r, wrist_l, wrist_r, hip_l, hip_r, knee_l, knee_r, ankle_l, ankle_r]
    for p in pts:
        r = 5
        d.ellipse([(p[0] - r) * SCALE, (p[1] - r) * SCALE, (p[0] + r) * SCALE, (p[1] + r) * SCALE], fill=softcolor)

def session(t, path):
    img, d = new_phone("#000000")
    # capture area
    rr(d, (0, 0, W, H - 250), 0, fill=t["surface"])
    draw_skeleton(d, W / 2, 300, 1.7, t["accent"], t["accentSoft"], 70)
    # top chips
    rr(d, (20, 50, 64, 90), 20, fill="#00000088")
    text(d, (42, 70), "X", font(16, True), t["text"], anchor="mm")
    rr(d, (140, 50, 320, 90), 20, fill="#00000088")
    text(d, (230, 70), "Push-ups", font(15, True), t["text"], anchor="mm")
    rr(d, (376, 50, 440, 90), 20, fill="#00000088")
    text(d, (408, 70), "cam", font(13, True), t["text"], anchor="mm")
    # bottom HUD
    rr(d, (0, H - 250, W, H), 28, fill=t["background"])
    text(d, (28, H - 226), "REPS", font(13, True), t["textMuted"])
    text(d, (24, H - 210), "12", font(78, True), t["accent"])
    # state chip (down -> accent)
    rr(d, (330, H - 214, 432, H - 178), 18, fill=t["accent"])
    text(d, (381, H - 196), "Down", font(14, True), t["onAccent"], anchor="mm")
    text(d, (432, H - 150), "timer 0:24", font(13), t["textMuted"], anchor="ra")
    rr(d, (28, H - 128, 432, H - 72), 16, fill=t["accent"])
    text(d, (W / 2, H - 100), "Finish set", font(17, True), t["onAccent"], anchor="mm")
    img.save(path)

def progress(t, path):
    img, d = new_phone(t["background"])
    statusbar(d, t)
    text(d, (28, 58), "Progress", font(34, True), t["text"])
    stat_tile(d, 28, 118, 194, 92, t, "Total reps", "1,240", accent=True)
    stat_tile(d, 238, 118, 194, 92, t, "Sessions", "38")
    stat_tile(d, 28, 220, 194, 92, t, "Day streak", "5")
    stat_tile(d, 238, 220, 194, 92, t, "Best set", "42")
    # chart card
    rr(d, (28, 332, 432, 560), 18, fill=t["surface"], outline=t["border"])
    text(d, (44, 350), "Reps per day", font(16, True), t["text"])
    vals = [12, 0, 30, 22, 40, 18, 35]
    mx = max(vals)
    bx, by, bw, bh = 44, 384, 372, 120
    n = len(vals)
    gap = 8
    bar_w = (bw - gap * (n - 1)) / n
    for i, v in enumerate(vals):
        x = bx + i * (bar_w + gap)
        barh = (v / mx) * bh
        y = by + bh - barh
        rr(d, (x, y, x + bar_w, by + bh), 4, fill=t["accent"] if v > 0 else t["track"])
    # segmented
    rr(d, (44, 516, 416, 548), 12, fill=t["surfaceAlt"])
    rr(d, (48, 520, 230, 544), 10, fill=t["accent"])
    text(d, (139, 532), "7 days", font(13, True), t["onAccent"], anchor="mm")
    text(d, (323, 532), "30 days", font(13, True), t["textMuted"], anchor="mm")
    # by exercise
    text(d, (28, 580), "By exercise", font(16, True), t["text"])
    rr(d, (28, 606, 432, 792), 18, fill=t["surface"], outline=t["border"])
    rows = [("Push-ups", "best set 42", "520"), ("Squats", "best set 35", "410"), ("Pull-ups", "best set 12", "180")]
    for i, (name, best, total) in enumerate(rows):
        y = 622 + i * 56
        d.ellipse([(44) * SCALE, y * SCALE, (68) * SCALE, (y + 24) * SCALE], fill=t["accent"])
        text(d, (80, y), name, font(15, True), t["text"])
        text(d, (80, y + 20), best, font(11), t["textMuted"])
        text(d, (416, y + 6), total, font(18, True), t["accent"], anchor="ra")
        if i < len(rows) - 1:
            d.line([(44 * SCALE, (y + 44) * SCALE), (416 * SCALE, (y + 44) * SCALE)], fill=t["border"], width=SCALE)
    # tab bar
    rr(d, (0, H - 74, W, H), 0, fill=t["surface"])
    d.line([(0, (H - 74) * SCALE), (W * SCALE, (H - 74) * SCALE)], fill=t["border"], width=SCALE)
    for i, lbl in enumerate(["Home", "Progress", "Settings"]):
        cx = W / 6 + i * W / 3
        active = i == 1
        text(d, (cx, H - 40), lbl, font(12, True), t["accent"] if active else t["textMuted"], anchor="mm")
    img.save(path)

os.makedirs("docs/images", exist_ok=True)
home(DARK, "docs/images/home_dark.png")
home(LIGHT, "docs/images/home_light.png")
session(DARK, "docs/images/session_dark.png")
progress(LIGHT, "docs/images/progress_light.png")

# combine into one contact sheet for convenience
imgs = [Image.open(p) for p in ["docs/images/home_dark.png", "docs/images/session_dark.png",
                                 "docs/images/progress_light.png", "docs/images/home_light.png"]]
pad = 30
cw = sum(i.width for i in imgs) + pad * (len(imgs) + 1)
ch = max(i.height for i in imgs) + pad * 2
sheet = Image.new("RGB", (cw, ch), (245, 245, 247))
x = pad
for im in imgs:
    sheet.paste(im, (x, pad))
    x += im.width + pad
sheet.save("docs/images/previews.png")
print("rendered previews")
PY_DONE = True
