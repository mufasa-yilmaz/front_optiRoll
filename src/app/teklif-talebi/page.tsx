'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createCustomerRequest } from '@/lib/api';

const initialForm = {
  firma_adi: '',
  yetkili_adi: '',
  email: '',
  telefon: '',
  m2: '',
  panel_width: '',
  panel_length: '1',
  il: '',
  bitis_tarihi: '',
  musteri_notu: '',
};

type FormState = typeof initialForm;

/** Metin ve sayı alanları için ortak odak stilleri (landing / dashboard ile uyumlu). */
const inputClassName =
  'w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/90 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-shadow';

const labelClassName = 'mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400';

/**
 * Teklif talebi formunda metin alanını günceller.
 */
function setTextField(setForm: React.Dispatch<React.SetStateAction<FormState>>, key: keyof FormState, value: string) {
  setForm((prev) => ({ ...prev, [key]: value }));
}

/**
 * Etiket ve form kontrolü için tipografi tutarlı sarmalayıcı.
 */
function FormField({
  id,
  label,
  required,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

/**
 * Sol sütunda gösterilen kısa bilgi satırı (ikon + metin).
 */
function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
      <span className="material-symbols-outlined text-primary shrink-0 text-[22px]">{icon}</span>
      <span className="leading-relaxed">{text}</span>
    </li>
  );
}

/**
 * Müşteri teklif talebi sayfası: landing ile uyumlu düzen, iletişim ve teknik form, API'ye POST.
 */
export default function TeklifTalebiPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Formu doğrular; hata varsa false döner.
   */
  function validate(): boolean {
    if (!form.firma_adi.trim()) {
      toast.error('Firma adı zorunludur');
      return false;
    }
    if (!form.yetkili_adi.trim()) {
      toast.error('Yetkili adı zorunludur');
      return false;
    }
    if (!form.email.trim()) {
      toast.error('E-posta zorunludur');
      return false;
    }
    const em = form.email.trim();
    if (!em.includes('@') || em.split('@').length !== 2 || !em.split('@')[1].includes('.')) {
      toast.error('Geçerli bir e-posta girin');
      return false;
    }
    if (!form.telefon.trim() || form.telefon.replace(/\D/g, '').length < 6) {
      toast.error('Telefon numarası zorunludur (en az 6 rakam)');
      return false;
    }
    const m2 = Number(form.m2);
    const pw = Number(form.panel_width);
    const pl = Number(form.panel_length);
    if (!Number.isFinite(m2) || m2 <= 0) {
      toast.error('Geçerli bir m² değeri girin');
      return false;
    }
    if (!Number.isFinite(pw) || pw <= 0) {
      toast.error('Panel genişliği 0’dan büyük olmalıdır');
      return false;
    }
    if (!Number.isFinite(pl) || pl <= 0) {
      toast.error('Panel uzunluğu 0’dan büyük olmalıdır');
      return false;
    }
    return true;
  }

  /**
   * Form gönderimini işler ve başarıda formu sıfırlar.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createCustomerRequest({
        firma_adi: form.firma_adi.trim(),
        yetkili_adi: form.yetkili_adi.trim(),
        email: form.email.trim(),
        telefon: form.telefon.trim(),
        m2: Number(form.m2),
        panel_width: Number(form.panel_width),
        panel_length: Number(form.panel_length) || 1,
        il: form.il.trim() || undefined,
        bitis_tarihi: form.bitis_tarihi || undefined,
        musteri_notu: form.musteri_notu.trim() || undefined,
      });
      toast.success('Talebiniz alındı. En kısa sürede size dönüş yapılacaktır.');
      setForm(initialForm);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gönderim başarısız');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background-light dark:bg-background-dark">
      <div className="pointer-events-none absolute -top-[20%] -right-[15%] h-[70%] w-[55%] rounded-full bg-gradient-to-br from-primary/8 via-accent/10 to-transparent blur-3xl dark:from-primary/15 dark:via-accent/5" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[40%] w-[45%] rounded-full bg-gradient-to-tr from-accent/5 to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary dark:text-accent transition-colors hover:gap-3"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Ana sayfaya dön
        </Link>

        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent dark:border-accent/30 dark:bg-accent/15">
              <span className="material-symbols-outlined text-[16px]">request_quote</span>
              Teklif talebi
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-primary dark:text-white sm:text-4xl lg:text-[2.5rem] lg:leading-[1.15]">
              Tahmini fiyat için bilgilerinizi bırakın
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Formu doldurduğunuzda talebiniz ekibimize düşer; uygunluk ve teknik detaylara göre size dönüş yapılır.
            </p>

            <ul className="mt-10 space-y-4">
              <InfoRow icon="verified_user" text="İletişim ve talep verileriniz yalnızca değerlendirme amacıyla kullanılır." />
              <InfoRow icon="schedule" text="Ön inceleme süreci genelde 1–2 iş günü içinde başlatılır." />
              <InfoRow icon="inventory_2" text="m² ve panel ölçüleri, teklifin doğruluğu için önemlidir." />
            </ul>

            <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Süreç</p>
              <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex gap-2">
                  <span className="font-bold text-primary">1.</span> Formu gönderin
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span> Ekibimiz talebi inceler
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span> Size iletişim kanalınızdan dönüş yapılır
                </li>
              </ol>
            </div>
          </div>

          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-xl shadow-slate-300/25 ring-1 ring-slate-100/80 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-none dark:ring-slate-800"
            >
              <div className="border-b border-slate-100 bg-gradient-to-r from-primary/[0.06] to-transparent px-6 py-5 dark:border-slate-800 dark:from-primary/10">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md">
                    <span className="material-symbols-outlined text-[24px]">edit_document</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Talep formu</h2>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      Zorunlu alanlar <span className="text-accent">*</span> ile işaretlidir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 p-6 sm:p-8">
                <div>
                  <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <span className="material-symbols-outlined text-primary text-xl">corporate_fare</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Firma ve iletişim</span>
                  </div>
                  <div className="space-y-5">
                    <FormField id="firma" label="Firma adı" required>
                      <input
                        id="firma"
                        required
                        value={form.firma_adi}
                        onChange={(e) => setTextField(setForm, 'firma_adi', e.target.value)}
                        className={inputClassName}
                        placeholder="Şirket veya proje adı"
                      />
                    </FormField>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField id="yetkili" label="Yetkili adı" required>
                        <input
                          id="yetkili"
                          required
                          value={form.yetkili_adi}
                          onChange={(e) => setTextField(setForm, 'yetkili_adi', e.target.value)}
                          className={inputClassName}
                          placeholder="Ad soyad"
                        />
                      </FormField>
                      <FormField id="email" label="E-posta" required>
                        <input
                          id="email"
                          required
                          type="email"
                          value={form.email}
                          onChange={(e) => setTextField(setForm, 'email', e.target.value)}
                          className={inputClassName}
                          placeholder="ornek@sirket.com"
                        />
                      </FormField>
                    </div>
                    <FormField id="tel" label="Telefon" required>
                      <input
                        id="tel"
                        required
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="Örn: 05xx xxx xx xx"
                        value={form.telefon}
                        onChange={(e) => setTextField(setForm, 'telefon', e.target.value)}
                        className={inputClassName}
                      />
                    </FormField>
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <span className="material-symbols-outlined text-primary text-xl">straighten</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Talep detayı</span>
                    <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Tahmini hesap
                    </span>
                  </div>
                  <div className="space-y-5">
                    <FormField id="m2" label="Talep (m²)" required>
                      <input
                        id="m2"
                        type="number"
                        min={1}
                        step={1}
                        value={form.m2}
                        onChange={(e) => setTextField(setForm, 'm2', e.target.value)}
                        className={inputClassName}
                        placeholder="Örn: 5000"
                      />
                    </FormField>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField id="pw" label="Panel genişliği (m)" required>
                        <input
                          id="pw"
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={form.panel_width}
                          onChange={(e) => setTextField(setForm, 'panel_width', e.target.value)}
                          className={inputClassName}
                          placeholder="Örn: 1.2"
                        />
                      </FormField>
                      <FormField id="pl" label="Panel kesim uzunluğu (m)" required>
                        <input
                          id="pl"
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={form.panel_length}
                          onChange={(e) => setTextField(setForm, 'panel_length', e.target.value)}
                          className={inputClassName}
                          placeholder="Örn: 1"
                        />
                      </FormField>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField id="il" label="İl">
                        <input
                          id="il"
                          value={form.il}
                          onChange={(e) => setTextField(setForm, 'il', e.target.value)}
                          className={inputClassName}
                          placeholder="Opsiyonel"
                        />
                      </FormField>
                      <FormField id="tarih" label="İstenen teslim tarihi">
                        <input
                          id="tarih"
                          type="date"
                          value={form.bitis_tarihi}
                          onChange={(e) => setTextField(setForm, 'bitis_tarihi', e.target.value)}
                          className={inputClassName}
                        />
                      </FormField>
                    </div>
                    <FormField id="not" label="Açıklama / not">
                      <textarea
                        id="not"
                        rows={4}
                        value={form.musteri_notu}
                        onChange={(e) => setTextField(setForm, 'musteri_notu', e.target.value)}
                        className={`${inputClassName} resize-y min-h-[108px]`}
                        placeholder="Malzeme, kalınlık, özel istekler..."
                      />
                    </FormField>
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Göndererek talebinizin işlenmesine onay vermiş olursunuz.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-[#1a2e4d] hover:shadow-xl hover:shadow-primary/30 disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
                  >
                    {submitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                        Gönderiliyor…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xl">send</span>
                        Talebi gönder
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
