/**
 * Supabase şema tipleri.
 *
 * DURUM: **el yazımı, geçici.** Henüz bir Supabase projesine migration uygulanmadı, bu
 * yüzden `supabase gen types` çalıştırılamadı. Buradaki tablolar tasarımda kararlaştırılan
 * şemadır (kanvas: Panel — konum, Panel — cihazlar, Güvenlik mimarisi), gerçek veri tabanı
 * değil.
 *
 * Şema uygulandığında bu dosya **üretilenle değiştirilir**:
 *   supabase gen types typescript --project-id <id> > src/types/supabase.ts
 *
 * Her tabloda RLS açık ve varsayılan reddet olacaktır; politikalar `auth.uid()` üzerinden
 * yazılır (CLAUDE.md §3.2).
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/** Telefon yetki seviyesi. Misafir kilit, arama ve kodlama komutlarını kullanamaz. */
export type YetkiSeviyesi = 'sahip' | 'misafir';

/** Konum paketinin geldiği taşıma. SIM808 2G-only olduğu için SMS yedek yoldur. */
export type KonumKaynagi = 'gprs' | 'sms';

export interface Database {
  public: {
    Tables: {
      araclar: {
        Row: {
          id: string;
          sahip_id: string;
          ad: string;
          firmware_surumu: string | null;
          son_gorulme: string | null;
          olusturuldu: string;
        };
        Insert: {
          id?: string;
          sahip_id: string;
          ad: string;
          firmware_surumu?: string | null;
          son_gorulme?: string | null;
          olusturuldu?: string;
        };
        Update: Partial<Database['public']['Tables']['araclar']['Insert']>;
        Relationships: [];
      };
      eslesmis_telefonlar: {
        Row: {
          id: string;
          arac_id: string;
          kullanici_id: string;
          cihaz_adi: string;
          yetki: YetkiSeviyesi;
          eslesme_tarihi: string;
          son_baglanti: string | null;
          iptal_edildi: boolean;
        };
        Insert: {
          id?: string;
          arac_id: string;
          kullanici_id: string;
          cihaz_adi: string;
          yetki?: YetkiSeviyesi;
          eslesme_tarihi?: string;
          son_baglanti?: string | null;
          iptal_edildi?: boolean;
        };
        Update: Partial<Database['public']['Tables']['eslesmis_telefonlar']['Insert']>;
        Relationships: [];
      };
      /**
       * Konum geçmişi HASSAS VERİDİR: saklama süresi sınırlı, panelde maskelenir, dışa
       * aktarım denetim kaydına yazılır (CLAUDE.md §3.2).
       *
       * Satırları cihaz doğrudan yazmaz — payload AES-GCM ile şifreli olarak Edge
       * Function'a gider, fonksiyon doğrulayıp service role ile yazar (sert kural 11).
       */
      konum_kayitlari: {
        Row: {
          id: string;
          arac_id: string;
          zaman: string;
          enlem: number;
          boylam: number;
          dogruluk_m: number | null;
          hiz_kmh: number | null;
          kaynak: KonumKaynagi;
          paket_dogrulandi: boolean;
        };
        Insert: {
          id?: string;
          arac_id: string;
          zaman: string;
          enlem: number;
          boylam: number;
          dogruluk_m?: number | null;
          hiz_kmh?: number | null;
          kaynak: KonumKaynagi;
          paket_dogrulandi?: boolean;
        };
        Update: Partial<Database['public']['Tables']['konum_kayitlari']['Insert']>;
        Relationships: [];
      };
      denetim_kaydi: {
        Row: {
          id: string;
          kullanici_id: string | null;
          arac_id: string | null;
          islem: string;
          ayrinti: Json | null;
          zaman: string;
        };
        Insert: {
          id?: string;
          kullanici_id?: string | null;
          arac_id?: string | null;
          islem: string;
          ayrinti?: Json | null;
          zaman?: string;
        };
        Update: Partial<Database['public']['Tables']['denetim_kaydi']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      yetki_seviyesi: YetkiSeviyesi;
      konum_kaynagi: KonumKaynagi;
    };
    CompositeTypes: Record<never, never>;
  };
}
