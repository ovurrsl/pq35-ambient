#!/usr/bin/env python3
"""
PQ35-AMBIENT — CAN log analizi.

`firmware/` içindeki Listen-Only logger'ın çıktısını okur ve §12'deki bilinmeyen
ID'leri bulmaya çalışır. Bağımlılığı yok, saf stdlib.

    python3 tools/can-analiz.py ozet  log.txt
    python3 tools/can-analiz.py olay  log.txt

YÖNTEM — ve neden tek bir deneme yetmez
----------------------------------------
Bir CAN hattında sürekli değişen onlarca ID vardır: sayaçlar, sağlama toplamları,
sensör okumaları. Kapıyı bir kez açıp "hangi ID değişti" diye bakarsan elinde
onlarca aday kalır ve hepsi tesadüftür.

Bu yüzden araç şudur: **aynı eylemi birkaç kez tekrarla, her seferinde aynı etiketle
işaretle.** Araç yalnızca HER TEKRARDA değişen ID'leri öne çıkarır. Tekrarlanabilirlik
burada bir süs değil, sinyali gürültüden ayıran tek şeydir.

Taban (baseline), hiçbir olay penceresine girmeyen tüm çerçevelerdir. Bir ID'nin
tabanda kaç farklı yük ürettiği de raporlanır: tabanda zaten 500 çeşit üreten bir ID,
olayda da yeni bir yük üretir ve bu hiçbir şey ifade etmez.
"""

from __future__ import annotations

import argparse
import collections
import sys
from dataclasses import dataclass, field


@dataclass
class Cerceve:
    t_us: int
    kimlik: str
    ext: bool
    rtr: bool
    veri: bytes


@dataclass
class Isaret:
    t_us: int
    etiket: str


@dataclass
class Log:
    cerceveler: list[Cerceve] = field(default_factory=list)
    isaretler: list[Isaret] = field(default_factory=list)
    basliklar: list[str] = field(default_factory=list)
    uyarilar: int = 0


def log_oku(yol: str) -> Log:
    log = Log()
    with open(yol, encoding="utf-8", errors="replace") as f:
        for ham in f:
            satir = ham.strip()
            if not satir:
                continue

            if satir.startswith("#"):
                log.basliklar.append(satir)
                if "UYARI" in satir:
                    log.uyarilar += 1
                continue

            if satir.startswith("!"):
                parca = satir[1:].split(",", 1)
                if len(parca) == 2 and parca[0].isdigit():
                    log.isaretler.append(Isaret(int(parca[0]), parca[1]))
                continue

            if satir.startswith("@"):
                continue  # STAT satırı — analiz için gerekli değil

            p = satir.split(",")
            if len(p) < 5 or not p[0].lstrip("-").isdigit():
                continue
            try:
                veri = bytes.fromhex(p[5]) if len(p) > 5 and p[5] else b""
            except ValueError:
                continue
            log.cerceveler.append(
                Cerceve(int(p[0]), p[1].upper(), p[2] == "1", p[3] == "1", veri)
            )
    return log


def sure_sn(log: Log) -> float:
    if not log.cerceveler:
        return 0.0
    return (log.cerceveler[-1].t_us - log.cerceveler[0].t_us) / 1e6


def komut_ozet(log: Log, _args) -> int:
    if not log.cerceveler:
        print("Logda hiç çerçeve yok.")
        return 1

    sure = sure_sn(log)
    sayim: dict[str, int] = collections.Counter()
    yukler: dict[str, set[bytes]] = collections.defaultdict(set)
    # Her ID için: hangi bitler hiç 1 oldu, hangileri hiç 0 oldu.
    bir_olan: dict[str, bytearray] = {}
    sifir_olan: dict[str, bytearray] = {}

    for c in log.cerceveler:
        sayim[c.kimlik] += 1
        yukler[c.kimlik].add(c.veri)
        n = len(c.veri)
        if c.kimlik not in bir_olan:
            bir_olan[c.kimlik] = bytearray(8)
            sifir_olan[c.kimlik] = bytearray(8)
        for i in range(min(n, 8)):
            bir_olan[c.kimlik][i] |= c.veri[i]
            sifir_olan[c.kimlik][i] |= (~c.veri[i]) & 0xFF

    print(f"Süre {sure:.1f} sn · {len(log.cerceveler)} çerçeve · "
          f"{len(sayim)} farklı ID · {len(log.isaretler)} işaret")
    if log.uyarilar:
        print(f"!! logda {log.uyarilar} uyarı satırı var — kayıp çerçeve olabilir")
    print()
    print(f"{'ID':>8}  {'adet':>7}  {'Hz':>6}  {'çeşit':>6}  değişen bitler")
    print("-" * 72)

    for kimlik, adet in sorted(sayim.items(), key=lambda kv: -kv[1]):
        hz = adet / sure if sure else 0
        cesit = len(yukler[kimlik])
        degisen = bytes(bir_olan[kimlik][i] & sifir_olan[kimlik][i] for i in range(8))
        harita = " ".join(f"{b:02X}" for b in degisen)
        if not any(degisen):
            harita = "— (sabit)"
        print(f"{kimlik:>8}  {adet:>7}  {hz:>6.1f}  {cesit:>6}  {harita}")

    print()
    print("'değişen bitler': o bayttaki hangi bitler log boyunca hem 0 hem 1 oldu.")
    print("Sabit baytlar sinyal taşımaz; aramayı değişenlere daraltır.")
    return 0


def komut_olay(log: Log, args) -> int:
    if not log.isaretler:
        print("Logda hiç işaret yok. Araçta eylemi yapıp Enter'a basman gerekiyordu.")
        return 1

    once_us = int(args.once * 1e6)
    sonra_us = int(args.sonra * 1e6)

    pencereler = [(i.t_us - once_us, i.t_us + sonra_us, i.etiket) for i in log.isaretler]

    def pencerede(t: int) -> bool:
        return any(b <= t <= s for b, s, _ in pencereler)

    # Taban: hiçbir olay penceresine girmeyen her şey.
    taban: dict[str, set[bytes]] = collections.defaultdict(set)
    for c in log.cerceveler:
        if not pencerede(c.t_us):
            taban[c.kimlik].add(c.veri)

    if not taban:
        print("Taban boş — işaret pencereleri tüm logu kaplıyor.")
        print("Daha uzun sakin bir kayıt al ya da --once/--sonra değerlerini küçült.")
        return 1

    # Aynı etiketli işaretler bir olay sınıfıdır; tekrarlanabilirlik buradan çıkar.
    siniflar: dict[str, list[tuple[int, int]]] = collections.defaultdict(list)
    for b, s, etiket in pencereler:
        siniflar[etiket].append((b, s))

    for etiket, aralik in siniflar.items():
        tekrar = len(aralik)
        print()
        print("=" * 72)
        print(f"OLAY: {etiket}   ({tekrar} tekrar)")
        print("=" * 72)

        # Her tekrarda hangi ID'ler tabanda görülmemiş bir yük üretti?
        tekrarda_yeni: list[dict[str, set[bytes]]] = []
        for b, s in aralik:
            yeni: dict[str, set[bytes]] = collections.defaultdict(set)
            for c in log.cerceveler:
                if b <= c.t_us <= s and c.veri not in taban.get(c.kimlik, set()):
                    yeni[c.kimlik].add(c.veri)
            tekrarda_yeni.append(yeni)

        adaylar: dict[str, int] = collections.Counter()
        for yeni in tekrarda_yeni:
            for kimlik in yeni:
                adaylar[kimlik] += 1

        if not adaylar:
            print("Hiçbir ID tabanda görülmeyen bir yük üretmedi.")
            print("Pencere dar olabilir (--sonra'yı büyüt) ya da eylem bu hatta yansımıyor.")
            continue

        def sirala(kv):
            kimlik, kac = kv
            # Önce her tekrarda değişenler; sonra tabanda en az çeşit üretenler.
            return (-kac, len(taban.get(kimlik, ())))

        print(f"{'ID':>8}  {'tekrar':>7}  {'taban çeşidi':>13}  değerlendirme")
        print("-" * 72)
        for kimlik, kac in sorted(adaylar.items(), key=sirala):
            if kac < tekrar and not args.hepsi:
                continue
            taban_cesit = len(taban.get(kimlik, ()))
            if kac == tekrar and taban_cesit <= args.sessiz_esik:
                not_ = "GÜÇLÜ ADAY"
            elif kac == tekrar:
                not_ = "her tekrarda değişti ama zaten gürültülü"
            else:
                not_ = f"yalnızca {kac}/{tekrar} tekrarda — tesadüf olabilir"
            print(f"{kimlik:>8}  {kac:>4}/{tekrar}  {taban_cesit:>13}  {not_}")

        # Güçlü adaylar için bit düzeyinde fark.
        print()
        for kimlik, kac in sorted(adaylar.items(), key=sirala):
            if kac < tekrar:
                continue
            taban_cesit = len(taban.get(kimlik, ()))
            if taban_cesit > args.sessiz_esik:
                continue
            tum_yeni: set[bytes] = set()
            for yeni in tekrarda_yeni:
                tum_yeni |= yeni.get(kimlik, set())
            fark = bytearray(8)
            for t in taban.get(kimlik, set()):
                for y in tum_yeni:
                    for i in range(min(len(t), len(y), 8)):
                        fark[i] |= t[i] ^ y[i]
            print(f"  {kimlik}: değişen bitler  " + " ".join(f"{b:02X}" for b in fark))
            ornek = sorted(tum_yeni)[:3]
            for o in ornek:
                print(f"    olayda görülen yük: {o.hex().upper()}")
            tb = sorted(taban.get(kimlik, set()))[:2]
            for o in tb:
                print(f"    tabandaki yük     : {o.hex().upper()}")
            print()

    print()
    print("SONRAKİ ADIM: güçlü adayı doğrula — aynı eylemi yeniden logla ve o ID'nin")
    print("aynı bitlerinin aynı yönde değiştiğini gör. Doğrulanmadan CLAUDE.md §12'den")
    print("çıkarma; tek seferlik bir eşleşme kanıt değildir.")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    alt = ap.add_subparsers(dest="komut", required=True)

    o = alt.add_parser("ozet", help="ID başına sayım, hız ve değişen bit haritası")
    o.add_argument("log")
    o.set_defaults(fn=komut_ozet)

    e = alt.add_parser("olay", help="işaretlerin çevresinde ne değişti")
    e.add_argument("log")
    e.add_argument("--once", type=float, default=1.0,
                   help="işaretten kaç saniye öncesi pencereye dahil (varsayılan 1.0)")
    e.add_argument("--sonra", type=float, default=3.0,
                   help="işaretten kaç saniye sonrası pencereye dahil (varsayılan 3.0)")
    e.add_argument("--sessiz-esik", type=int, default=8,
                   help="tabanda bu kadar veya daha az çeşit üreten ID 'sessiz' sayılır")
    e.add_argument("--hepsi", action="store_true",
                   help="her tekrarda değişmeyen adayları da göster")
    e.set_defaults(fn=komut_olay)

    args = ap.parse_args()
    try:
        log = log_oku(args.log)
    except OSError as hata:
        print(f"Log okunamadı: {hata}", file=sys.stderr)
        return 1
    return args.fn(log, args)


if __name__ == "__main__":
    sys.exit(main())
