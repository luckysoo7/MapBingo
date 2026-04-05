#!/usr/bin/env python3
"""
한국 GPS 좌표가 담긴 샘플 JPEG 100장 생성
출력: tests/fixtures/sample_photos/
"""

import random
import struct
from pathlib import Path
from datetime import datetime, timedelta

from PIL import Image
import piexif

OUTPUT_DIR = Path(__file__).parent.parent / "tests/fixtures/sample_photos"

# 한국 위경도 범위
LAT_MIN, LAT_MAX = 33.0, 38.9   # 제주 ~ 강원 북단
LNG_MIN, LNG_MAX = 124.6, 129.6 # 서해 ~ 동해

# 주요 도시 근처에 클러스터링 (더 자연스럽게)
CLUSTERS = [
    (37.5665, 126.9780, 0.3),  # 서울 (30%)
    (35.1796, 129.0756, 0.15), # 부산
    (35.8714, 128.6014, 0.10), # 대구
    (37.4563, 126.7052, 0.10), # 인천
    (35.1595, 126.8526, 0.08), # 광주
    (36.3504, 127.3845, 0.07), # 대전
    (37.8228, 127.1480, 0.05), # 춘천
    (33.4996, 126.5312, 0.05), # 제주
    (None,    None,     0.10), # 완전 랜덤 (10%)
]

# 날짜 범위: 최근 5년
DATE_START = datetime(2020, 1, 1)
DATE_END   = datetime(2025, 12, 31)


def random_korean_coords() -> tuple[float, float]:
    """도시 클러스터 기반 랜덤 좌표 생성"""
    r = random.random()
    cumulative = 0.0
    for lat, lng, weight in CLUSTERS:
        cumulative += weight
        if r < cumulative:
            if lat is None:
                return (
                    random.uniform(LAT_MIN, LAT_MAX),
                    random.uniform(LNG_MIN, LNG_MAX),
                )
            # 도시 중심 ± 0.2도 가우시안
            return (
                lat + random.gauss(0, 0.15),
                lng + random.gauss(0, 0.15),
            )
    return random.uniform(LAT_MIN, LAT_MAX), random.uniform(LNG_MIN, LNG_MAX)


def to_dms_rational(value: float) -> list[tuple[int, int]]:
    """float 도 → EXIF DMS rational [(도,1), (분,1), (초*100,100)]"""
    value = abs(value)
    d = int(value)
    m = int((value - d) * 60)
    s = round(((value - d) * 60 - m) * 60 * 100)
    return [(d, 1), (m, 1), (s, 100)]


def random_date() -> datetime:
    delta = DATE_END - DATE_START
    return DATE_START + timedelta(days=random.randint(0, delta.days),
                                   seconds=random.randint(0, 86400))


def make_jpeg(path: Path, lat: float, lng: float, dt: datetime) -> None:
    # 작은 랜덤 노이즈 이미지 (32x32)
    pixels = bytes([random.randint(0, 255) for _ in range(32 * 32 * 3)])
    img = Image.frombytes("RGB", (32, 32), pixels)

    # EXIF GPS 데이터
    gps_ifd = {
        piexif.GPSIFD.GPSLatitudeRef:  b'N' if lat >= 0 else b'S',
        piexif.GPSIFD.GPSLatitude:     to_dms_rational(lat),
        piexif.GPSIFD.GPSLongitudeRef: b'E' if lng >= 0 else b'W',
        piexif.GPSIFD.GPSLongitude:    to_dms_rational(lng),
    }

    date_str  = dt.strftime("%Y:%m:%d").encode()
    time_str  = dt.strftime("%H:%M:%S").encode()

    exif_ifd = {
        piexif.ExifIFD.DateTimeOriginal:  date_str + b" " + time_str,
        piexif.ExifIFD.DateTimeDigitized: date_str + b" " + time_str,
    }
    zeroth_ifd = {
        piexif.ImageIFD.DateTime: date_str + b" " + time_str,
        piexif.ImageIFD.Make:     b"SampleCam",
        piexif.ImageIFD.Model:    b"SnapRoute-Test",
    }

    exif_dict = {"0th": zeroth_ifd, "Exif": exif_ifd, "GPS": gps_ifd}
    exif_bytes = piexif.dump(exif_dict)

    img.save(path, format="JPEG", exif=exif_bytes, quality=30)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"생성 중: {OUTPUT_DIR}")
    for i in range(1, 101):
        lat, lng = random_korean_coords()
        # 한국 경계 클램프
        lat = max(LAT_MIN, min(LAT_MAX, lat))
        lng = max(LNG_MIN, min(LNG_MAX, lng))
        dt  = random_date()

        fname = OUTPUT_DIR / f"sample_{i:03d}.jpg"
        make_jpeg(fname, lat, lng, dt)

        if i % 10 == 0:
            print(f"  {i}/100 완료")

    print(f"\n완료: {OUTPUT_DIR}")
    print(f"총 {len(list(OUTPUT_DIR.glob('*.jpg')))}장")


if __name__ == "__main__":
    main()
