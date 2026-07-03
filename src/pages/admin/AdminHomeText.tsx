import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { HomeText } from "../../lib/types";
import { useToast } from "../../contexts/ToastContext";
import AdminSectionHeader from "../../components/AdminSectionHeader";

export default function AdminHomeText() {
  const { showToast } = useToast();
  const [homeText, setHomeText] = useState<HomeText | null>(null);
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("home_text")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setHomeText(data as HomeText);
          setHeroTitle(data.hero_title || "");
          setHeroSubtitle(data.hero_subtitle || "");
          setAboutText(data.about_text || "");
        }
        setLoading(false);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { hero_title: heroTitle.trim(), hero_subtitle: heroSubtitle.trim(), about_text: aboutText.trim() };

    if (homeText) {
      const { data, error } = await supabase.from("home_text").update(payload).eq("id", homeText.id).select().maybeSingle();
      setSaving(false);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      if (data) {
        setHomeText(data as HomeText);
        showToast("Homepage text updated.", "success");
      }
    } else {
      const { data, error } = await supabase.from("home_text").insert(payload).select().maybeSingle();
      setSaving(false);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      if (data) {
        setHomeText(data as HomeText);
        showToast("Homepage text created.", "success");
      }
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border-ash bg-transparent px-4 py-2.5 text-sm text-luxury-black outline-none placeholder:text-ash-grey dark:border-dark-grey dark:text-pure-white";

  if (loading) {
    return <div className="h-48 w-full animate-pulse rounded-2xl bg-beige-cream dark:bg-dark-grey" />;
  }

  return (
    <div>
      <AdminSectionHeader emoji="🏠" title="Homepage Text" subtitle="Edit hero & about content" />
      <form
        onSubmit={save}
        className="mt-6 max-w-2xl space-y-4 rounded-2xl border border-border-ash bg-pure-white p-6 transition-theme dark:border-dark-grey dark:bg-dark-grey"
      >
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest text-ash-grey">Hero Title</span>
          <input className={inputClass} value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest text-ash-grey">Hero Subtitle</span>
          <textarea className={inputClass} rows={2} value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest text-ash-grey">About Text</span>
          <textarea className={inputClass} rows={4} value={aboutText} onChange={(e) => setAboutText(e.target.value)} />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-luxury-black px-6 py-2.5 text-xs uppercase tracking-widest text-pure-white disabled:opacity-50 dark:bg-pure-white dark:text-luxury-black"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
