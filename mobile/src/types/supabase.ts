/**
 * Supabase şema tipleri — ÜRETİLMİŞ DOSYA, elle düzenleme.
 *
 * Kaynak: pq35-ambient projesi (eu-central-1), migration'lar uygulandıktan sonra
 * `supabase gen types typescript` çıktısı. Şemayı değiştirdiğinde yeniden üret:
 *
 *   supabase gen types typescript --project-id <proje-id> > src/types/supabase.ts
 *
 * İki şey burada GÖRÜNMÜYOR ve bu bilinçli:
 *   · `Functions` boş — RLS yardımcıları (`arac_sahibi_mi`, `arac_erisimi_var`) dışa
 *     açılmayan `guvenlik` şemasına taşındı, PostgREST üzerinden çağrılamazlar.
 *   · `cihaz_anahtarlari` tabloda görünür ama RLS'te hiçbir istemci politikası yok;
 *     yalnızca Edge Function'daki service role erişir (CLAUDE.md sert kural 11).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      araclar: {
        Row: {
          ad: string
          firmware_surumu: string | null
          id: string
          olusturuldu: string
          sahip_id: string
          son_gorulme: string | null
          vin_son4: string | null
        }
        Insert: {
          ad: string
          firmware_surumu?: string | null
          id?: string
          olusturuldu?: string
          sahip_id: string
          son_gorulme?: string | null
          vin_son4?: string | null
        }
        Update: {
          ad?: string
          firmware_surumu?: string | null
          id?: string
          olusturuldu?: string
          sahip_id?: string
          son_gorulme?: string | null
          vin_son4?: string | null
        }
        Relationships: []
      }
      bolge_ayarlari: {
        Row: {
          acik: boolean
          arac_id: string
          bolge: string
          guncellendi: string
          olay_tepkileri: Json
          parlaklik: number
          renk: string
        }
        Insert: {
          acik?: boolean
          arac_id: string
          bolge: string
          guncellendi?: string
          olay_tepkileri?: Json
          parlaklik?: number
          renk?: string
        }
        Update: {
          acik?: boolean
          arac_id?: string
          bolge?: string
          guncellendi?: string
          olay_tepkileri?: Json
          parlaklik?: number
          renk?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolge_ayarlari_arac_id_fkey"
            columns: ["arac_id"]
            isOneToOne: false
            referencedRelation: "araclar"
            referencedColumns: ["id"]
          },
        ]
      }
      cihaz_anahtarlari: {
        Row: {
          aes_anahtari: string
          arac_id: string
          id: string
          iptal_edildi: boolean
          olusturuldu: string
          son_kullanim: string | null
          son_sayac: number
          token_ozeti: string
        }
        Insert: {
          aes_anahtari: string
          arac_id: string
          id?: string
          iptal_edildi?: boolean
          olusturuldu?: string
          son_kullanim?: string | null
          son_sayac?: number
          token_ozeti: string
        }
        Update: {
          aes_anahtari?: string
          arac_id?: string
          id?: string
          iptal_edildi?: boolean
          olusturuldu?: string
          son_kullanim?: string | null
          son_sayac?: number
          token_ozeti?: string
        }
        Relationships: [
          {
            foreignKeyName: "cihaz_anahtarlari_arac_id_fkey"
            columns: ["arac_id"]
            isOneToOne: false
            referencedRelation: "araclar"
            referencedColumns: ["id"]
          },
        ]
      }
      denetim_kaydi: {
        Row: {
          arac_id: string | null
          ayrinti: Json | null
          id: string
          ip: unknown
          islem: string
          kullanici_id: string | null
          zaman: string
        }
        Insert: {
          arac_id?: string | null
          ayrinti?: Json | null
          id?: string
          ip?: unknown
          islem: string
          kullanici_id?: string | null
          zaman?: string
        }
        Update: {
          arac_id?: string | null
          ayrinti?: Json | null
          id?: string
          ip?: unknown
          islem?: string
          kullanici_id?: string | null
          zaman?: string
        }
        Relationships: [
          {
            foreignKeyName: "denetim_kaydi_arac_id_fkey"
            columns: ["arac_id"]
            isOneToOne: false
            referencedRelation: "araclar"
            referencedColumns: ["id"]
          },
        ]
      }
      eslesmis_telefonlar: {
        Row: {
          arac_id: string
          cihaz_adi: string
          eslesme_tarihi: string
          id: string
          iptal_edildi: boolean
          kullanici_id: string
          son_baglanti: string | null
          yetki: Database["public"]["Enums"]["yetki_seviyesi"]
        }
        Insert: {
          arac_id: string
          cihaz_adi: string
          eslesme_tarihi?: string
          id?: string
          iptal_edildi?: boolean
          kullanici_id: string
          son_baglanti?: string | null
          yetki?: Database["public"]["Enums"]["yetki_seviyesi"]
        }
        Update: {
          arac_id?: string
          cihaz_adi?: string
          eslesme_tarihi?: string
          id?: string
          iptal_edildi?: boolean
          kullanici_id?: string
          son_baglanti?: string | null
          yetki?: Database["public"]["Enums"]["yetki_seviyesi"]
        }
        Relationships: [
          {
            foreignKeyName: "eslesmis_telefonlar_arac_id_fkey"
            columns: ["arac_id"]
            isOneToOne: false
            referencedRelation: "araclar"
            referencedColumns: ["id"]
          },
        ]
      }
      konum_kayitlari: {
        Row: {
          alindi: string
          arac_id: string
          boylam: number
          dogruluk_m: number | null
          enlem: number
          hiz_kmh: number | null
          id: string
          kaynak: Database["public"]["Enums"]["konum_kaynagi"]
          paket_dogrulandi: boolean
          zaman: string
        }
        Insert: {
          alindi?: string
          arac_id: string
          boylam: number
          dogruluk_m?: number | null
          enlem: number
          hiz_kmh?: number | null
          id?: string
          kaynak: Database["public"]["Enums"]["konum_kaynagi"]
          paket_dogrulandi?: boolean
          zaman: string
        }
        Update: {
          alindi?: string
          arac_id?: string
          boylam?: number
          dogruluk_m?: number | null
          enlem?: number
          hiz_kmh?: number | null
          id?: string
          kaynak?: Database["public"]["Enums"]["konum_kaynagi"]
          paket_dogrulandi?: boolean
          zaman?: string
        }
        Relationships: [
          {
            foreignKeyName: "konum_kayitlari_arac_id_fkey"
            columns: ["arac_id"]
            isOneToOne: false
            referencedRelation: "araclar"
            referencedColumns: ["id"]
          },
        ]
      }
      sahneler: {
        Row: {
          aciklama: string | null
          ad: string
          arac_id: string
          ayarlar: Json
          id: string
          olusturuldu: string
        }
        Insert: {
          aciklama?: string | null
          ad: string
          arac_id: string
          ayarlar?: Json
          id?: string
          olusturuldu?: string
        }
        Update: {
          aciklama?: string | null
          ad?: string
          arac_id?: string
          ayarlar?: Json
          id?: string
          olusturuldu?: string
        }
        Relationships: [
          {
            foreignKeyName: "sahneler_arac_id_fkey"
            columns: ["arac_id"]
            isOneToOne: false
            referencedRelation: "araclar"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      konum_kaynagi: "gprs" | "sms"
      yetki_seviyesi: "sahip" | "misafir"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      konum_kaynagi: ["gprs", "sms"],
      yetki_seviyesi: ["sahip", "misafir"],
    },
  },
} as const
