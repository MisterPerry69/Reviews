"""
Genera icon-192.png e icon-512.png per rank★d.
Stile: stellina ambra centrata su sfondo grigio scuro (#3a3a3c).
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

BG    = (58, 58, 60)     # #3a3a3c — grigio scuro app
AMBER = (224, 160, 80)   # #e0a050 — accento ALL

def _blend(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def _point_in_star(px, py, cx, cy, r_out, r_in, points=5):
    """True se (px,py) è dentro la stella a punte (poligono), punta in alto."""
    verts = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        ang = -math.pi / 2 + i * math.pi / points
        verts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    # point-in-polygon (ray casting)
    inside = False
    n = len(verts)
    j = n - 1
    for i in range(n):
        xi, yi = verts[i]; xj, yj = verts[j]
        if ((yi > py) != (yj > py)) and (px < (xj - xi) * (py - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside

def draw_icon(size):
    pixels = [[BG] * size for _ in range(size)]
    cx = cy = size / 2.0
    r_out = size * 0.42
    r_in  = r_out * 0.40
    ss = 4  # super-sampling per anti-aliasing

    y0 = int(cy - r_out - 2); y1 = int(cy + r_out + 2)
    x0 = int(cx - r_out - 2); x1 = int(cx + r_out + 2)
    for y in range(max(0, y0), min(size, y1)):
        for x in range(max(0, x0), min(size, x1)):
            inside = 0
            for sy in range(ss):
                for sx in range(ss):
                    px = x + (sx + 0.5) / ss
                    py = y + (sy + 0.5) / ss
                    if _point_in_star(px, py, cx, cy, r_out, r_in):
                        inside += 1
            if inside:
                pixels[y][x] = _blend(BG, AMBER, inside / (ss * ss))
    return pixels

for size, name in [(192, "icon-192.png"), (512, "icon-512.png")]:
    p = draw_icon(size)
    data = png(size, size, p)
    with open(name, "wb") as f:
        f.write(data)
    print(f"Generato {name} ({len(data)} bytes)")
