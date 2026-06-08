"""
Genera icon-192.png e icon-512.png per Reel (Reviews).
Stile: pellicola cinematografica su sfondo ambra scuro.
Nessuna dipendenza esterna — solo stdlib Python.
Run: python gen_icons.py
"""

import struct, zlib, math

def png(width, height, pixels):
    def chunk(t, d):
        c = zlib.crc32(t + d) & 0xFFFFFFFF
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", c)

    raw = b""
    for y in range(height):
        raw += b"\x00"
        for x in range(width):
            r, g, b = pixels[y][x]
            raw += bytes([r, g, b])

    compressed = zlib.compress(raw, 9)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr = chunk(b"IHDR", ihdr_data)
    idat = chunk(b"IDAT", compressed)
    iend = chunk(b"IEND", b"")
    return sig + ihdr + idat + iend

def draw_icon(size):
    BG     = (18, 16, 14)       # #12100e — ambra scurissimo
    AMBER  = (245, 158, 11)     # #f59e0b
    DARK   = (30, 24, 18)       # bordi pellicola
    WHITE  = (240, 230, 210)    # perforations

    pixels = [[BG] * size for _ in range(size)]
    cx, cy = size // 2, size // 2
    r_icon = int(size * 0.42)

    def set_px(x, y, color):
        if 0 <= x < size and 0 <= y < size:
            pixels[y][x] = color

    def fill_rect(x0, y0, x1, y1, color):
        for y in range(max(0, y0), min(size, y1)):
            for x in range(max(0, x0), min(size, x1)):
                pixels[y][x] = color

    def fill_circle(cx, cy, r, color):
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    set_px(x, y, color)

    # ---- Sfondo circolare ----
    fill_circle(cx, cy, r_icon, DARK)

    # ---- Film reel (cerchio ambra) ----
    r_outer = int(r_icon * 0.88)
    r_inner = int(r_icon * 0.28)
    for y in range(cy - r_outer, cy + r_outer + 1):
        for x in range(cx - r_outer, cx + r_outer + 1):
            d = (x - cx) ** 2 + (y - cy) ** 2
            if r_inner * r_inner <= d <= r_outer * r_outer:
                pixels[y][x] = AMBER

    # ---- Fori pellicola (8 fori intorno al mozzo) ----
    r_holes = int(r_icon * 0.62)
    hole_r  = int(r_icon * 0.12)
    for i in range(8):
        angle = i * math.pi / 4
        hx = int(cx + r_holes * math.cos(angle))
        hy = int(cy + r_holes * math.sin(angle))
        fill_circle(hx, hy, hole_r, DARK)

    # ---- Mozzo centrale ----
    fill_circle(cx, cy, r_inner, DARK)
    fill_circle(cx, cy, int(r_inner * 0.55), AMBER)

    # ---- Stella a 5 punte ambra chiaro sopra ----
    star_r_outer = int(r_icon * 0.18)
    star_r_inner = int(r_icon * 0.08)
    star_cx = cx
    star_cy = int(cy - r_icon * 0.52)
    for y in range(star_cy - star_r_outer - 1, star_cy + star_r_outer + 2):
        for x in range(star_cx - star_r_outer - 1, star_cx + star_r_outer + 2):
            if 0 <= x < size and 0 <= y < size:
                angle = math.atan2(y - star_cy, x - star_cx) + math.pi / 2
                sector = (angle % (2 * math.pi / 5))
                t = sector / (math.pi / 5)
                if t > 1: t = 2 - t
                r_boundary = star_r_inner + (star_r_outer - star_r_inner) * t
                dist = math.sqrt((x - star_cx) ** 2 + (y - star_cy) ** 2)
                if dist <= r_boundary:
                    pixels[y][x] = (253, 211, 100)

    return pixels

for size, name in [(192, "icon-192.png"), (512, "icon-512.png")]:
    p = draw_icon(size)
    data = png(size, size, p)
    with open(name, "wb") as f:
        f.write(data)
    print(f"Generato {name} ({len(data)} bytes)")
