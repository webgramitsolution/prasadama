import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { Bell, Check, CircleHelp, Globe, House, Link2, MapPin, Package, Pencil, Plus, Shield, Star, Ticket, Trash2, Truck, UserRound, Wallet, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { getSavedAddresses, type AccountAddress } from "@/lib/accountAddresses";

const panel = "rounded-xl border border-[#eee4dd] bg-white p-4 sm:p-5";
const primary = "bg-[#850d12] text-white hover:bg-[#6c090e]";
const heading = "font-display font-bold text-[#800b12]";
const field = "h-10 w-full rounded-md border bg-white px-3 text-sm";

function SectionTitle({ title, description }: { title: string; description: string }) {
  return <div><h1 className={cn(heading, "text-3xl")}>{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>;
}

export function OrderProgress({ status }: { status: string }) {
  const cancelled = status === "cancelled";
  const stages = cancelled ? ["Order Placed", "Cancelled"] : status === "delivered"
    ? ["Order Placed", "Packed", "Shipped", "Delivered"]
    : ["Order Placed", status === "processing" ? "Processing" : "Packed", "Shipped", "Out for Delivery", "Delivered"];
  const index = ({ processing: 1, packed: 1, shipped: 2, out_for_delivery: 3, delivered: 3, cancelled: 1 } as Record<string, number>)[status] ?? 0;
  return <ol aria-label="Order progress" className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:gap-0">
    {stages.map((stage, position) => <li key={stage} aria-current={position === index ? "step" : undefined}
      className="flex flex-1 items-center gap-2 text-xs sm:flex-col sm:items-start">
      <span className="flex items-center sm:w-full">
        <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-200", position <= index && "bg-[#850d12] text-white")}>
          {position <= index ? <Check size={13} /> : <span className="h-1 w-1 rounded-full bg-slate-500" />}
        </span>
        {position < stages.length - 1 && <span className={cn("hidden h-px flex-1 bg-slate-200 sm:block", position < index && "bg-[#850d12]")} />}
      </span>
      {stage}
    </li>)}
  </ol>;
}

const addressFields = [
  ["name", "Full Name", "text"], ["phone", "Phone Number", "tel"], ["postalCode", "Pincode", "text"],
  ["state", "State", "text"], ["city", "City", "text"], ["street", "House number, building and street", "text"], ["landmark", "Landmark (optional)", "text"],
] as const;
const addressTypes = { Home: House, Office: Briefcase, Other: MapPin };
type LegacyAddress = { full_name: string | null; phone: string | null; postal_code: string | null; address: string | null; state: string | null; city: string | null } | null | undefined;
const emptyAddress: AccountAddress = { id: "", type: "Home", name: "", phone: "", postalCode: "", state: "", city: "", street: "", landmark: "", isDefault: false };

export function AccountAddresses({ user, profile }: { user: User; profile: LegacyAddress }) {
  const { toast } = useToast();
  const saved: AccountAddress[] = Array.isArray(user.user_metadata["saved_addresses"]) ? getSavedAddresses(user) : profile?.address ? [{
    ...emptyAddress, id: "legacy", name: profile.full_name ?? "", phone: profile.phone ?? "", postalCode: profile.postal_code ?? "",
    state: profile.state ?? "", city: profile.city ?? "", street: profile.address, isDefault: true,
  }] : [];
  const [local, setLocal] = useState<AccountAddress[] | null>(null);
  const addresses = local ?? saved;
  const [draft, setDraft] = useState<AccountAddress | null>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [pinResult, setPinResult] = useState("");

  async function persist(next: AccountAddress[]) {
    const normalized = next.length && !next.some(address => address.isDefault)
      ? next.map((address, index) => ({ ...address, isDefault: index === 0 })) : next;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { saved_addresses: normalized } });
    setSaving(false);
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    setLocal(normalized);
    setDraft(null);
    toast({ title: "Saved addresses updated" });
  }

  async function checkPincode() {
    if (!draft || !/^\d{6}$/.test(draft.postalCode)) { setPinResult("Enter a 6-digit pincode."); return; }
    const pin = draft.postalCode;
    const draftId = draft.id;
    setChecking(true);
    const { data, error } = await supabase.from("delivery_pincodes").select("city, state").eq("pincode", pin).eq("is_active", true).maybeSingle();
    setChecking(false);
    if (error || !data) { setPinResult(error ? "Pincode check unavailable." : "This pincode wasn’t found in the delivery list."); return; }
    setPinResult("Pincode found in the delivery list.");
    setDraft(current => current?.postalCode === pin && current.id === draftId ? { ...current, city: data.city || current.city, state: data.state || current.state } : current);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || saving) return;
    const next = { ...draft, id: draft.id || crypto.randomUUID() };
    const remaining = addresses.filter(address => address.id !== next.id)
      .map(address => next.isDefault ? { ...address, isDefault: false } : address);
    void persist([...remaining, next]);
  }

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <SectionTitle title="My Addresses" description="Manage your saved delivery addresses." />
      <Button className={cn(primary, "w-full sm:w-auto")} onClick={() => { setPinResult(""); setDraft({ ...emptyAddress, name: profile?.full_name ?? "" }); }}><Plus size={16} className="mr-2" />Add New Address</Button>
    </div>
    {!addresses.length && <p className={panel}>You haven’t saved a delivery address.</p>}
    {[...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)).map(address => {
      const Icon = addressTypes[address.type];
      return <article key={address.id} className={cn(panel, "flex flex-wrap items-start gap-3", address.isDefault && "border-[#cb777b] bg-[#fcf0ee]")}>
        <span className="rounded-full bg-[#faead7] p-3 text-[#850d12]"><Icon size={21} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{address.type} {address.isDefault && <span className="ml-1 rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800">Default</span>}</h2>
          <p className="mt-1 text-sm">{address.name}</p><p className="text-sm">{[address.street, address.landmark, address.city, address.state, address.postalCode].filter(Boolean).join(", ")}</p>
          <p className="text-sm">{address.phone}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Button variant="ghost" size="sm" disabled={saving} onClick={() => { setPinResult(""); setDraft(address); }}><Pencil size={14} className="mr-1" />Edit</Button>
          <Button variant="ghost" size="sm" disabled={saving} onClick={() => { if (window.confirm("Remove this saved address?")) void persist(addresses.filter(item => item.id !== address.id)); }}><Trash2 size={14} className="mr-1" />Remove</Button>
        </div>
      </article>;
    })}
    <Dialog open={!!draft} onOpenChange={open => { if (!open && !saving) setDraft(null); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle className={cn(heading, "text-2xl")}>{draft?.id ? "Edit Address" : "Add New Address"}</DialogTitle></DialogHeader>
        {draft && <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(addressTypes).map(([type, Icon]) => <Button type="button" key={type} variant="outline" aria-pressed={draft.type === type}
              className={cn("h-auto flex-col gap-1 py-3", draft.type === type && "border-[#850d12] bg-[#fcf0ee] text-[#850d12]")}
              onClick={() => setDraft({ ...draft, type: type as AccountAddress["type"] })}><Icon size={19} />{type}</Button>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {addressFields.map(([key, label, type]) => <div key={key} className={cn("space-y-1", key === "street" && "sm:col-span-2")}>
              <Label htmlFor={`address-${key}`}>{label}</Label>
              <div className="flex gap-2">
                <Input id={`address-${key}`} type={type} inputMode={key === "postalCode" ? "numeric" : undefined}
                  pattern={key === "postalCode" ? "[0-9]{6}" : key === "phone" ? "(?:[+]91 ?)?[0-9]{10}" : undefined}
                  required={key !== "landmark"} value={draft[key]} onChange={event => {
                    if (key === "postalCode") setPinResult("");
                    setDraft({ ...draft, [key]: event.target.value });
                  }} />
                {key === "postalCode" && <Button type="button" className={primary} disabled={checking} onClick={checkPincode}>Check</Button>}
              </div>
              {key === "postalCode" && pinResult && <p role="status" className="text-xs">{pinResult}</p>}
            </div>)}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isDefault} onChange={event => setDraft({ ...draft, isDefault: event.target.checked })} />Save as default address</label>
          <Button className={cn(primary, "w-full")} disabled={saving}>{saving ? "Saving…" : "Save Address"}</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </section>;
}

type Review = Tables<"product_reviews"> & { products: Pick<Tables<"products">, "name" | "images"> | null };
export function AccountReviews({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("All Reviews");
  const [edit, setEdit] = useState<Review | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let current = true;
    supabase.from("product_reviews").select("*, products(name, images)").eq("user_id", userId).order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!current) return;
        if (error) setLoadError(error.message);
        setReviews(data ?? []);
      });
    return () => { current = false; };
  }, [userId]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edit) return;
    setSaving(true);
    const { data, error } = await supabase.from("product_reviews").update({
      rating: edit.rating, review_title: edit.review_title, review_text: edit.review_text,
    }).eq("id", edit.id).eq("user_id", userId).select("*, products(name, images)").single();
    setSaving(false);
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    setReviews(current => current?.map(review => review.id === data.id ? data : review) ?? []);
    setEdit(null);
    toast({ title: "Review updated" });
  }

  async function remove(review: Review) {
    if (!window.confirm("Delete this review?")) return;
    const { error } = await supabase.from("product_reviews").delete().eq("id", review.id).eq("user_id", userId);
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    setReviews(current => current?.filter(item => item.id !== review.id) ?? []);
    toast({ title: "Review removed" });
  }

  const list = reviews ?? [];
  const visible = list.filter(review => filter === "All Reviews" || (review.is_approved ? filter === "Published" : filter === "Pending"));
  return <section className="space-y-4">
    <SectionTitle title="My Reviews" description="Read and manage the reviews you’ve shared." />
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_13rem]">
      <div className="space-y-3">
        <div className="flex overflow-x-auto rounded-lg border bg-white p-1">
          {["All Reviews", "Published", "Pending"].map(tab => <Button key={tab} variant="ghost" aria-pressed={tab === filter}
            className={cn("shrink-0", tab === filter && "bg-[#fce9e8] text-[#850d12]")} onClick={() => setFilter(tab)}>{tab}</Button>)}
        </div>
        {loadError && <p className={panel} role="alert">{loadError}</p>}
        {!loadError && (!reviews ? <p>Loading reviews…</p> : !visible.length && <p className={panel}>No reviews in this view.</p>)}
        {visible.map(review => <article className={cn(panel, "flex flex-wrap gap-3")} key={review.id}>
          {review.products?.images?.[0] && <img className="h-20 w-20 rounded-lg object-cover" src={review.products.images[0]} alt="" loading="lazy" />}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{review.products?.name ?? "Product review"}</h2><span className={cn("rounded px-2 py-1 text-xs", review.is_approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900")}>{review.is_approved ? "Published" : "Pending"}</span></div>
            <p aria-label={`${review.rating} out of 5 stars`} className="my-1 flex text-amber-500">{[1, 2, 3, 4, 5].map(star => <Star key={star} size={16} fill={star <= review.rating ? "currentColor" : "none"} />)}</p>
            {review.review_title && <p className="font-medium">{review.review_title}</p>}<p className="text-sm text-muted-foreground">{review.review_text}</p>
            <div className="mt-2 flex flex-wrap gap-1">{review.photos?.map((photo, index) => <img key={index} src={photo} alt="" className="h-12 w-12 rounded object-cover" loading="lazy" />)}</div>
          </div>
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => setEdit(review)}>Edit</Button>
            <Button variant="outline" size="sm" onClick={() => remove(review)}>Delete</Button>
          </div>
        </article>)}
      </div>
      <aside className={panel}><h2 className={cn(heading, "text-xl")}>Overall Rating</h2><p className="mt-2 text-3xl font-bold">{list.length ? (list.reduce((sum, review) => sum + review.rating, 0) / list.length).toFixed(1) : "—"}<span className="text-sm font-normal"> / 5</span></p><p className="text-sm text-muted-foreground">{list.length} reviews</p></aside>
    </div>
    <Dialog open={!!edit} onOpenChange={open => { if (!open && !saving) setEdit(null); }}>
      <DialogContent><DialogHeader><DialogTitle>Edit Review</DialogTitle></DialogHeader>
        {edit && <form className="space-y-3" onSubmit={save}>
          <Label htmlFor="review-rating">Rating</Label><select id="review-rating" className={field} value={edit.rating} onChange={event => setEdit({ ...edit, rating: Number(event.target.value) })}>{[1, 2, 3, 4, 5].map(rating => <option key={rating} value={rating}>{rating} / 5</option>)}</select>
          <Label htmlFor="review-title">Title</Label><Input id="review-title" maxLength={150} value={edit.review_title ?? ""} onChange={event => setEdit({ ...edit, review_title: event.target.value })} />
          <Label htmlFor="review-body">Review</Label><textarea id="review-body" className="w-full rounded-md border p-3" rows={4} maxLength={2000} value={edit.review_text ?? ""} onChange={event => setEdit({ ...edit, review_text: event.target.value })} />
          <Button className={primary} disabled={saving}>Save Review</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </section>;
}

const settingsTabs = [
  ["Profile", UserRound], ["Security", Shield], ["Notifications", Bell], ["Preferences", Globe], ["Connected Accounts", Link2],
] as const;

export function AccountSettings({ user, profileContent, openAddresses, openSupport }: {
  user: User; profileContent: ReactNode; openAddresses: () => void; openSupport: () => void;
}) {
  const [tab, setTab] = useState("Profile");
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const previous = user.user_metadata["account_preferences"];
  const [language, setLanguage] = useState<string>(previous?.language === "hi" ? "hi" : "en");
  const [birthday, setBirthday] = useState<string>(typeof previous?.birthday === "string" ? previous.birthday : "");
  const [offers, setOffers] = useState(previous?.offers === true);

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { account_preferences: { language, birthday, offers } } });
    setSaving(false);
    toast(error ? { title: error.message, variant: "destructive" } : { title: "Account preferences saved" });
  }
  return <section className="space-y-4">
    <SectionTitle title="Account Settings" description="Manage your profile, security and communication preferences." />
    <div className="flex overflow-x-auto rounded-xl border bg-white">
      {settingsTabs.map(([name, Icon]) => <Button key={name} variant="ghost" aria-pressed={tab === name} onClick={() => setTab(name)}
        className={cn("h-auto flex-1 shrink-0 flex-col gap-1 rounded-none border-b-2 border-transparent p-3", tab === name && "border-[#850d12] text-[#850d12]")}><Icon size={19} />{name}</Button>)}
    </div>
    {tab === "Profile" && <>
      {profileContent}
      <div className={panel}><h2 className={cn(heading, "text-xl")}>Default Delivery Address</h2><p className="my-2 text-sm">Manage the addresses you can select at checkout.</p><Button variant="outline" onClick={openAddresses}>Manage Addresses</Button></div>
      <div className={cn(panel, "bg-[#fbe8e6]")}><h2 className={cn(heading, "text-xl")}>Delete Account</h2><p className="my-2 text-sm">Contact support to request account deletion.</p><Button variant="outline" onClick={openSupport}>Contact Support</Button></div>
    </>}
    {tab === "Security" && <div className={panel}><h2 className={cn(heading, "text-xl")}>Password</h2><p className="my-2 text-sm">Request a secure reset link for your account.</p><Button asChild className={primary}><Link to="/forgot-password">Reset Password</Link></Button></div>}
    {tab === "Notifications" && <form className={cn(panel, "space-y-3")} onSubmit={savePreferences}>
      <h2 className={cn(heading, "text-xl")}>Communication Preferences</h2>
      <label className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"><span><strong>Promotions and offers</strong><span className="block text-muted-foreground">Record whether you’d like to hear about offers.</span></span><input type="checkbox" checked={offers} onChange={event => setOffers(event.target.checked)} /></label>
      <p className="text-sm text-muted-foreground">Visit My Orders for current shipping and delivery updates.</p>
      <Button className={primary} disabled={saving}>Save Preferences</Button>
    </form>}
    {tab === "Preferences" && <form className={cn(panel, "space-y-3")} onSubmit={savePreferences}>
      <h2 className={cn(heading, "text-xl")}>Shopping Preferences</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm"><span>Preferred language</span><select className={field} value={language} onChange={event => setLanguage(event.target.value)}><option value="en">English</option><option value="hi">Hindi</option></select></label>
        <label className="space-y-1 text-sm"><span>Date of birth (optional)</span><Input type="date" value={birthday} onChange={event => setBirthday(event.target.value)} /></label>
      </div>
      <p className="text-sm text-muted-foreground">Set your default delivery address in My Addresses. Store prices are displayed in INR.</p>
      <div className="flex flex-wrap gap-2"><Button className={primary} disabled={saving}>Save Preferences</Button><Button type="button" variant="outline" onClick={openAddresses}>Manage Addresses</Button></div>
    </form>}
    {tab === "Connected Accounts" && <div className={panel}><h2 className={cn(heading, "text-xl")}>Sign-in Methods</h2>
      <ul className="mt-3 divide-y">{user.identities?.map(identity => <li key={identity.id} className="flex justify-between py-3 capitalize"><span>{identity.provider}</span><span className="text-sm text-emerald-800">Connected</span></li>)}</ul>
      {!user.identities?.length && <p className="mt-2 text-sm">No connected providers are available.</p>}
    </div>}
  </section>;
}

const helpTopics = [
  { icon: Truck, title: "Track My Order", body: "Check your shipment status from My Orders.", to: "/track-order" },
  { icon: Package, title: "Returns & Refunds", body: "Read the returns process and eligibility.", to: "/help" },
  { icon: Ticket, title: "Offers & Coupons", body: "Get help applying a coupon at checkout.", to: "/help" },
  { icon: Wallet, title: "Account & Payments", body: "Find answers about billing and payments.", to: "/help" },
];

export function AccountSupport({ openChat }: { openChat: () => void }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const topics = helpTopics.filter(topic => `${topic.title} ${topic.body}`.toLowerCase().includes(query));
  return <section className="space-y-4">
    <SectionTitle title="Support" description="Find answers or get in touch with our support team." />
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
      {helpTopics.map(({ icon: Icon, title, body, to }) => <Link to={to} key={title} className={cn(panel, "block hover:border-[#b84d53]")}>
        <Icon className="mb-2 text-[#850d12]" size={22} /><h2 className={heading}>{title}</h2><p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </Link>)}
    </div>
    <div className="rounded-xl bg-[#fbe8e6] p-5"><h2 className={cn(heading, "mb-2 text-xl")}>How can we help you?</h2>
      <Input className="bg-white" aria-label="Search help topics" placeholder="Search delivery, refunds, coupons…" value={search} onChange={event => setSearch(event.target.value)} />
    </div>
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div className={panel}><h2 className={cn(heading, "text-xl")}>Popular Help Topics</h2>
        <div className="mt-2 divide-y">{topics.map(({ icon: Icon, title, body, to }) => <details key={title} className="py-3">
          <summary className="cursor-pointer text-sm font-semibold"><Icon className="mr-2 inline text-[#850d12]" size={17} />{title}</summary>
          <p className="ml-6 mt-2 text-sm text-muted-foreground">{body} <Link className="underline" to={to}>Learn more</Link></p>
        </details>)}</div>
        {!topics.length && <p className="mt-2 text-sm">No help topics match your search.</p>}
      </div>
      <div className={panel}><h2 className={cn(heading, "text-xl")}>Contact Us</h2><p className="my-2 text-sm text-muted-foreground">Tell us what you need help with.</p>
        <Button className={cn(primary, "w-full")} onClick={openChat}><CircleHelp size={16} className="mr-2" />Open Support Chat</Button>
        <Button asChild variant="link" className="mt-2"><Link to="/help">View Help Centre</Link></Button>
      </div>
    </div>
  </section>;
}
