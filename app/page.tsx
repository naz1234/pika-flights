"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CirclePlus,
  Cloud,
  CloudOff,
  Luggage,
  MapPin,
  PackageCheck,
  PencilLine,
  PlaneTakeoff,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

type AppTab = "flights" | "packing" | "baggage";

type Flight = {
  id: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  date: string;
  departTime: string;
  arriveTime: string;
  terminal: string;
  gate: string;
  bookingRef: string;
  notes: string;
};

type PackingItem = {
  id: string;
  label: string;
  category: string;
  checked: boolean;
};

type BagMeasurement = {
  id: string;
  name: string;
  combinedWeight: number;
};

type PlanState = {
  tripName: string;
  traveler: string;
  flights: Flight[];
  packing: PackingItem[];
  baggage: {
    checkedAllowance: number;
    personWeight: number;
    bags: BagMeasurement[];
  };
};

type StoredPlan = Partial<Omit<PlanState, "baggage">> & {
  baggage?: Partial<PlanState["baggage"]> & {
    cabinAllowance?: number;
    items?: unknown[];
  };
};

const categories = ["Documents", "Clothes", "Toiletries", "Tech", "Health", "Comfort"];

const bagThemes = [
  {
    card: "border-[#bfe4d2] bg-gradient-to-br from-[#ddf5e9] via-[#edf9f2] to-[#fbfefc] shadow-[0_12px_26px_rgba(17,125,103,0.11)]",
    stripe: "bg-gradient-to-r from-[#117d67] via-[#33b995] to-[#8bd8bd]",
    orb: "bg-[#7ed4b3]/20",
    badge: "bg-[#117d67] text-white shadow-[0_7px_16px_rgba(17,125,103,0.2)]",
    accent: "text-[#086553]",
    result: "border-[#bfe4d2] bg-white/70 text-[#086553]",
  },
  {
    card: "border-[#d9c5eb] bg-gradient-to-br from-[#eadcf8] via-[#f4edfb] to-[#fdfbff] shadow-[0_12px_26px_rgba(113,48,108,0.11)]",
    stripe: "bg-gradient-to-r from-[#71306c] via-[#a86fa9] to-[#c7a9e5]",
    orb: "bg-[#b398db]/20",
    badge: "bg-[#71306c] text-white shadow-[0_7px_16px_rgba(113,48,108,0.2)]",
    accent: "text-[#71306c]",
    result: "border-[#d9c5eb] bg-white/70 text-[#71306c]",
  },
  {
    card: "border-[#edc4d6] bg-gradient-to-br from-[#f9dce9] via-[#fcecf3] to-[#fffafd] shadow-[0_12px_26px_rgba(166,45,87,0.1)]",
    stripe: "bg-gradient-to-r from-[#a62d57] via-[#d75f8d] to-[#eea4c4]",
    orb: "bg-[#ec8fbd]/20",
    badge: "bg-[#a62d57] text-white shadow-[0_7px_16px_rgba(166,45,87,0.2)]",
    accent: "text-[#a62d57]",
    result: "border-[#edc4d6] bg-white/70 text-[#a62d57]",
  },
  {
    card: "border-[#ecd99d] bg-gradient-to-br from-[#ffedbc] via-[#fff5d9] to-[#fffdf6] shadow-[0_12px_26px_rgba(121,84,17,0.1)]",
    stripe: "bg-gradient-to-r from-[#b8790b] via-[#edb442] to-[#f4d77a]",
    orb: "bg-[#edb442]/20",
    badge: "bg-[#b8790b] text-white shadow-[0_7px_16px_rgba(184,121,11,0.2)]",
    accent: "text-[#795411]",
    result: "border-[#ecd99d] bg-white/70 text-[#795411]",
  },
] as const;

const starterPacking: Array<[string, string]> = [
  ["Passport / ID", "Documents"],
  ["Boarding pass", "Documents"],
  ["Visa / travel documents", "Documents"],
  ["Wallet & cards", "Documents"],
  ["Daily outfits", "Clothes"],
  ["Sleepwear", "Clothes"],
  ["Underwear & socks", "Clothes"],
  ["Jacket / prayer wear", "Clothes"],
  ["Toothbrush & toothpaste", "Toiletries"],
  ["Skincare / toiletries", "Toiletries"],
  ["Phone charger", "Tech"],
  ["Power bank", "Tech"],
  ["Travel adapter", "Tech"],
  ["Medication", "Health"],
  ["Mini first-aid items", "Health"],
  ["Neck pillow", "Comfort"],
  ["Water bottle", "Comfort"],
  ["Snacks", "Comfort"],
];

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyFlight = (): Flight => ({
  id: makeId(),
  airline: "",
  flightNumber: "",
  from: "",
  to: "",
  date: "",
  departTime: "",
  arriveTime: "",
  terminal: "",
  gate: "",
  bookingRef: "",
  notes: "",
});

const defaultState: PlanState = {
  tripName: "My next trip",
  traveler: "",
  flights: [emptyFlight()],
  packing: starterPacking.map(([label, category], index) => ({
    id: `starter-${index}`,
    label,
    category,
    checked: false,
  })),
  baggage: {
    checkedAllowance: 20,
    personWeight: 0,
    bags: [{ id: "starter-bag-1", name: "Bag 1", combinedWeight: 0 }],
  },
};

function toNonNegativeNumber(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizePlan(data: StoredPlan): PlanState {
  const savedBags: unknown[] = Array.isArray(data.baggage?.bags) ? data.baggage.bags : [];
  const bags = savedBags
    .filter((bag): bag is Record<string, unknown> => Boolean(bag) && typeof bag === "object")
    .map((bag, index) => ({
      id: typeof bag.id === "string" ? bag.id : makeId(),
      name: typeof bag.name === "string" && bag.name.trim() ? bag.name : `Bag ${index + 1}`,
      combinedWeight: toNonNegativeNumber(bag.combinedWeight),
    }));

  return {
    tripName: typeof data.tripName === "string" ? data.tripName : defaultState.tripName,
    traveler: typeof data.traveler === "string" ? data.traveler : defaultState.traveler,
    flights: Array.isArray(data.flights) ? data.flights : defaultState.flights,
    packing: Array.isArray(data.packing) ? data.packing : defaultState.packing,
    baggage: {
      checkedAllowance: toNonNegativeNumber(data.baggage?.checkedAllowance, defaultState.baggage.checkedAllowance),
      personWeight: toNonNegativeNumber(data.baggage?.personWeight),
      bags: bags.length ? bags : [{ id: makeId(), name: "Bag 1", combinedWeight: 0 }],
    },
  };
}

const fieldClass =
  "h-12 rounded-[14px] border-[#ccdcd4] bg-[#fcfefd] px-3 text-base text-[#17344f] shadow-none placeholder:text-[#879790] focus-visible:border-[#b398db] focus-visible:ring-[#b398db]/25";

const surfaceClass =
  "rounded-[24px] border border-[#dfe9e6] bg-white p-4 shadow-[0_10px_26px_rgba(40,91,78,0.07),0_2px_5px_rgba(113,48,108,0.025)] sm:p-5";

const primaryButtonClass =
  "h-12 rounded-2xl bg-gradient-to-br from-[#117d67] to-[#086553] font-bold text-white shadow-[0_7px_16px_rgba(17,125,103,0.17)] transition-[background-color,box-shadow] duration-200 hover:shadow-[0_9px_20px_rgba(17,125,103,0.26)]";

const secondaryButtonClass =
  "h-12 rounded-2xl border border-[#d9c7e9] bg-[#f1e7fa] font-bold text-[#71306c] shadow-none transition-colors duration-200 hover:bg-[#e7d5f6]";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid min-w-0 max-w-full gap-1.5 text-xs font-bold text-[#5d6b79] ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function Home() {
  const [tab, setTab] = useState<AppTab>("flights");
  const [plan, setPlan] = useState<PlanState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"loading" | "saving" | "saved" | "offline">("loading");
  const [newPackingItem, setNewPackingItem] = useState("");
  const [newPackingCategory, setNewPackingCategory] = useState(categories[0]);
  const [clock, setClock] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPlan() {
      try {
        const response = await fetch("/api/state", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Load failed");
        const payload = (await response.json()) as { data: StoredPlan | null };
        if (payload.data) setPlan(normalizePlan(payload.data));
        setSaveState("saved");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setSaveState("offline");
      } finally {
        if (!controller.signal.aborted) setLoaded(true);
      }
    }

    loadPlan();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const immediate = window.setTimeout(() => setClock(Date.now()), 0);
    const interval = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        const response = await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: plan }),
        });
        if (!response.ok) throw new Error("Save failed");
        setSaveState("saved");
      } catch {
        setSaveState("offline");
      }
    }, 850);

    return () => window.clearTimeout(timer);
  }, [loaded, plan]);

  const firstFlight = plan.flights[0];
  const routeLabel = `${firstFlight?.from || "FROM"} → ${plan.flights.at(-1)?.to || "TO"}`;
  let countdown = "Add your travel date";
  if (firstFlight?.date && clock) {
    const departure = new Date(`${firstFlight.date}T${firstFlight.departTime || "00:00"}`);
    const difference = departure.getTime() - clock;
    if (!Number.isNaN(departure.getTime())) {
      if (difference <= 0) countdown = "Travel day is here";
      else {
        const days = Math.floor(difference / 86_400_000);
        const hours = Math.floor((difference % 86_400_000) / 3_600_000);
        countdown = days > 0 ? `${days} days ${hours} hrs to go` : `${hours} hours to go`;
      }
    }
  }

  const packedCount = plan.packing.filter((item) => item.checked).length;
  const packingPercent = plan.packing.length ? (packedCount / plan.packing.length) * 100 : 0;
  const personWeight = toNonNegativeNumber(plan.baggage.personWeight);
  const bagWeights = plan.baggage.bags.map((bag) =>
    personWeight > 0 && bag.combinedWeight >= personWeight ? bag.combinedWeight - personWeight : 0
  );
  const totalBagWeight = bagWeights.reduce((total, weight) => total + weight, 0);
  const baggageRemaining = plan.baggage.checkedAllowance - totalBagWeight;
  const baggagePercent = plan.baggage.checkedAllowance > 0
    ? Math.min((totalBagWeight / plan.baggage.checkedAllowance) * 100, 100)
    : 0;

  function updateFlight(id: string, patch: Partial<Flight>) {
    setPlan((current) => ({
      ...current,
      flights: current.flights.map((flight) => (flight.id === id ? { ...flight, ...patch } : flight)),
    }));
  }

  function addPackingItem() {
    const label = newPackingItem.trim();
    if (!label) return;
    setPlan((current) => ({
      ...current,
      packing: [...current.packing, { id: makeId(), label, category: newPackingCategory, checked: false }],
    }));
    setNewPackingItem("");
  }

  function addBag() {
    setPlan((current) => ({
      ...current,
      baggage: {
        ...current.baggage,
        bags: [
          ...current.baggage.bags,
          { id: makeId(), name: `Bag ${current.baggage.bags.length + 1}`, combinedWeight: 0 },
        ],
      },
    }));
  }

  function changeTab(nextTab: AppTab) {
    if (nextTab === tab) return;
    setTab(nextTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          <span className="block size-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: "url('/icon-192.png')" }} />
        </div>
        <div>
          <p className="eyebrow">Travel planner</p>
          <h1>Pika Flights</h1>
        </div>
        <button className={`top-action ${saveState === "offline" ? "offline" : ""}`} type="button" aria-label={saveState === "loading" ? "Loading travel plan" : saveState === "saving" ? "Saving travel plan" : saveState === "offline" ? "Cloud sync offline" : "Travel plan synced"} title={saveState === "offline" ? "Offline" : saveState === "saved" ? "Synced" : "Saving"}>
          {saveState === "offline" ? <CloudOff className="size-[21px]" /> : saveState === "saved" ? <Cloud className="size-[21px]" /> : <RotateCcw className="size-[21px] animate-spin" />}
        </button>
      </header>

      <main className="main-content">
        {tab === "flights" && (
          <section className="page-section space-y-5">
              <section className="relative overflow-hidden rounded-[30px] border-2 border-white bg-gradient-to-br from-[#d1f3e3] via-[#e6f9ed] to-[#e7f1f5] p-5 text-[#17344f] shadow-[0_12px_28px_rgba(40,124,97,0.12)] sm:p-6">
                <div className="absolute -right-20 -top-20 size-40 rounded-full bg-[#b398db]/15" />
                <div className="absolute -bottom-32 -left-16 size-40 rounded-full bg-[#ec8fbd]/20" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/70 px-3 py-1.5 text-[10px] font-bold text-[#71306c]"><PlaneTakeoff className="size-3.5" /> Next journey</span>
                    <PlaneTakeoff className="size-6 text-[#b8790b]" />
                  </div>
                  <Input aria-label="Trip name" value={plan.tripName} onChange={(event) => setPlan((current) => ({ ...current, tripName: event.target.value }))} className="mt-5 h-auto border-0 bg-transparent px-0 font-[Manrope] text-[26px] font-extrabold tracking-[-0.9px] text-[#17344f] shadow-none placeholder:text-[#6d8179] focus-visible:ring-0" placeholder="Name your trip" />
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="font-[Manrope] text-2xl font-extrabold tracking-[0.05em]">{routeLabel}</p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#486d63]"><CalendarDays className="size-4" /> {countdown}</p>
                    </div>
                    <div className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-white bg-[#f1e7fa] text-[#71306c] shadow-[0_4px_12px_rgba(113,48,108,0.08)]"><MapPin className="size-5" /></div>
                  </div>
                </div>
              </section>

              <section className={surfaceClass}>
                <div className="flex items-center justify-between gap-3">
                  <div><p className="eyebrow">Traveller</p><h2 className="font-[Manrope] text-xl font-extrabold tracking-[-0.5px] text-[#17344f]">Who is flying?</h2></div>
                  <div className="grid size-11 place-items-center rounded-2xl border-2 border-white bg-[#f1e7fa] text-[#71306c] shadow-[0_4px_12px_rgba(113,48,108,0.08)]"><BriefcaseBusiness className="size-5" /></div>
                </div>
                <Input aria-label="Traveller names" placeholder="Traveller name(s)" value={plan.traveler} onChange={(event) => setPlan((current) => ({ ...current, traveler: event.target.value }))} className={`${fieldClass} mt-4`} />
              </section>

              {plan.flights.map((flight, index) => (
                <section key={flight.id} className={surfaceClass}>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-[14px] bg-[#e1f6ec] font-[Manrope] text-sm font-extrabold text-[#086553]">{index + 1}</span>
                      <div><p className="eyebrow">Flight segment</p><h2 className="font-[Manrope] text-lg font-extrabold text-[#17344f]">{flight.from || "From"} <ArrowRight className="mx-1 inline size-4 text-[#ec8fbd]" /> {flight.to || "To"}</h2></div>
                    </div>
                    {plan.flights.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label={`Remove flight ${index + 1}`} className="size-11 rounded-[15px] text-[#a62d57] transition-colors hover:bg-[#fce8f2] hover:text-[#a62d57]" onClick={() => setPlan((current) => ({ ...current, flights: current.flights.filter((item) => item.id !== flight.id) }))}><Trash2 /></Button>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Field label="From"><Input maxLength={3} value={flight.from} onChange={(event) => updateFlight(flight.id, { from: event.target.value.toUpperCase() })} placeholder="JED" className={`${fieldClass} uppercase`} /></Field>
                    <Field label="To"><Input maxLength={3} value={flight.to} onChange={(event) => updateFlight(flight.id, { to: event.target.value.toUpperCase() })} placeholder="KUL" className={`${fieldClass} uppercase`} /></Field>
                    <Field label="Airline"><Input value={flight.airline} onChange={(event) => updateFlight(flight.id, { airline: event.target.value })} placeholder="Airline" className={fieldClass} /></Field>
                    <Field label="Flight no."><Input value={flight.flightNumber} onChange={(event) => updateFlight(flight.id, { flightNumber: event.target.value.toUpperCase() })} placeholder="MH 151" className={fieldClass} /></Field>
                    <Field label="Travel date" className="col-span-2"><Input type="date" value={flight.date} onChange={(event) => updateFlight(flight.id, { date: event.target.value })} className={fieldClass} /></Field>
                    <Field label="Departure"><Input type="time" value={flight.departTime} onChange={(event) => updateFlight(flight.id, { departTime: event.target.value })} className={fieldClass} /></Field>
                    <Field label="Arrival"><Input type="time" value={flight.arriveTime} onChange={(event) => updateFlight(flight.id, { arriveTime: event.target.value })} className={fieldClass} /></Field>
                    <Field label="Terminal"><Input value={flight.terminal} onChange={(event) => updateFlight(flight.id, { terminal: event.target.value })} placeholder="T1" className={fieldClass} /></Field>
                    <Field label="Gate"><Input value={flight.gate} onChange={(event) => updateFlight(flight.id, { gate: event.target.value })} placeholder="A12" className={fieldClass} /></Field>
                    <Field label="Booking reference" className="col-span-2"><Input value={flight.bookingRef} onChange={(event) => updateFlight(flight.id, { bookingRef: event.target.value.toUpperCase() })} placeholder="ABC123" className={fieldClass} /></Field>
                    <Field label="Notes" className="col-span-2 sm:col-span-4"><Textarea value={flight.notes} onChange={(event) => updateFlight(flight.id, { notes: event.target.value })} placeholder="Check-in, transfer or pickup notes…" className="min-h-24 rounded-[14px] border-[#ccdcd4] bg-[#fcfefd] px-3 text-base text-[#17344f] shadow-none placeholder:text-[#879790] focus-visible:border-[#b398db] focus-visible:ring-[#b398db]/25" /></Field>
                  </div>
                </section>
              ))}

              <Button type="button" variant="outline" className={`${secondaryButtonClass} w-full`} onClick={() => setPlan((current) => ({ ...current, flights: [...current.flights, emptyFlight()] }))}><CirclePlus className="size-5" /> Add another flight</Button>
          </section>
        )}

        {tab === "packing" && (
          <section className="page-section space-y-5">
              <section className="overflow-hidden rounded-[30px] border-2 border-white bg-gradient-to-br from-[#d1f3e3] via-[#e6f9ed] to-[#e7f1f5] p-5 text-[#17344f] shadow-[0_12px_28px_rgba(40,124,97,0.12)] sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="eyebrow">Packing progress</p><h2 className="mt-1 font-[Manrope] text-3xl font-extrabold tracking-[-0.9px]">{packedCount} of {plan.packing.length}</h2><p className="mt-1 text-xs font-semibold text-[#486d63]">items are safely in your bag</p></div>
                  <div className="grid size-16 place-items-center rounded-[21px] border-2 border-white bg-[#f1e7fa] text-[#71306c] shadow-[0_4px_12px_rgba(113,48,108,0.08)]"><PackageCheck className="size-8" /></div>
                </div>
                <Progress value={packingPercent} className="mt-5 h-3 bg-white/80 [&>div]:bg-[#117d67]" />
              </section>

              <section className={surfaceClass}>
                <div className="flex items-center justify-between gap-3">
                  <div><p className="eyebrow">Your list</p><h2 className="font-[Manrope] text-xl font-extrabold tracking-[-0.5px] text-[#17344f]">Ready, set, pack</h2></div>
                  {packedCount > 0 && <Button type="button" variant="ghost" size="sm" className="rounded-xl text-xs font-bold text-[#71306c] transition-colors hover:bg-[#f1e7fa] hover:text-[#71306c]" onClick={() => setPlan((current) => ({ ...current, packing: current.packing.map((item) => ({ ...item, checked: false })) }))}>Reset</Button>}
                </div>
                <div className="mt-5 space-y-5">
                  {categories.map((category) => {
                    const items = plan.packing.filter((item) => item.category === category);
                    if (!items.length) return null;
                    return (
                      <div key={category}>
                        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#71306c]"><span>{category}</span><span className="h-px flex-1 bg-[#dfe9e6]" /></div>
                        <div className="overflow-hidden rounded-[20px] border border-[#dfe9e6] bg-white">
                          {items.map((item) => (
                            <div key={item.id} className="group flex min-h-[58px] items-center gap-3 border-b border-[#dfe9e6] px-3 last:border-0">
                              <Checkbox id={item.id} checked={item.checked} onCheckedChange={(checked) => setPlan((current) => ({ ...current, packing: current.packing.map((packingItem) => packingItem.id === item.id ? { ...packingItem, checked: checked === true } : packingItem) }))} className="size-6 rounded-[9px] border-[#c7d6d0] data-[state=checked]:border-[#117d67] data-[state=checked]:bg-[#117d67]" />
                              <label htmlFor={item.id} className={`flex-1 cursor-pointer py-3 text-sm font-semibold ${item.checked ? "text-[#8a9a94] line-through" : "text-[#17344f]"}`}>{item.label}</label>
                              <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${item.label}`} className="size-11 rounded-[13px] text-[#a62d57] opacity-100 transition-colors hover:bg-[#fce8f2] hover:text-[#a62d57] sm:opacity-0 sm:group-hover:opacity-100" onClick={() => setPlan((current) => ({ ...current, packing: current.packing.filter((packingItem) => packingItem.id !== item.id) }))}><Trash2 className="size-4" /></Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[24px] border border-[#edc9da] bg-[#fff7fb] p-4 shadow-[0_10px_26px_rgba(40,91,78,0.05)] sm:p-5">
                <p className="eyebrow">Add your own</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px_auto]">
                  <Input value={newPackingItem} onChange={(event) => setNewPackingItem(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addPackingItem()} placeholder="e.g. Sunglasses" className={fieldClass} />
                  <NativeSelect value={newPackingCategory} onChange={(event) => setNewPackingCategory(event.target.value)} className="h-12 rounded-[14px] border-[#ccdcd4] bg-[#fcfefd] px-3 text-base font-semibold text-[#17344f]" aria-label="Packing category">{categories.map((category) => <NativeSelectOption key={category} value={category}>{category}</NativeSelectOption>)}</NativeSelect>
                  <Button type="button" onClick={addPackingItem} className={primaryButtonClass}><Plus /> Add</Button>
                </div>
              </section>
          </section>
        )}

        {tab === "baggage" && (
          <section className="page-section space-y-5">
              <section className="overflow-hidden rounded-[30px] border-2 border-white bg-gradient-to-br from-[#d1f3e3] via-[#e6f9ed] to-[#e7f1f5] p-5 text-[#17344f] shadow-[0_12px_28px_rgba(40,124,97,0.12)] sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="eyebrow">Baggage calculator</p><h2 className="mt-1 font-[Manrope] text-3xl font-extrabold tracking-[-0.9px]">Weigh every bag</h2><p className="mt-1 text-xs font-semibold text-[#486d63]">Use any body-weight scale—no luggage scale needed.</p></div>
                  <div className="grid size-16 place-items-center rounded-[21px] border-2 border-white bg-[#f1e7fa] text-[#71306c] shadow-[0_4px_12px_rgba(113,48,108,0.08)]"><Luggage className="size-8" /></div>
                </div>
              </section>

              <section className="rounded-[24px] border border-[#edc9da] bg-[#fff7fb] p-4 shadow-[0_10px_26px_rgba(40,91,78,0.05)] sm:p-5">
                <div>
                  <p className="eyebrow">Step 1</p>
                  <h2 className="font-[Manrope] text-xl font-extrabold tracking-[-0.5px] text-[#17344f]">Weigh yourself first</h2>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#5d6b79]">Stand on the scale without a bag and enter your weight.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Your weight (kg)" className="mt-4"><Input type="number" inputMode="decimal" min="0" step="0.1" value={plan.baggage.personWeight || ""} onChange={(event) => setPlan((current) => ({ ...current, baggage: { ...current.baggage, personWeight: toNonNegativeNumber(event.target.value) } }))} placeholder="e.g. 70" className={fieldClass} /></Field>
                  <Field label="Baggage allowance (kg)" className="mt-4"><Input type="number" inputMode="decimal" min="0" step="0.1" value={plan.baggage.checkedAllowance || ""} onChange={(event) => setPlan((current) => ({ ...current, baggage: { ...current.baggage, checkedAllowance: toNonNegativeNumber(event.target.value) } }))} placeholder="e.g. 20" className={fieldClass} /></Field>
                </div>
              </section>

              <section className={surfaceClass}>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="eyebrow">Step 2</p><h2 className="font-[Manrope] text-xl font-extrabold tracking-[-0.5px] text-[#17344f]">Hold each bag on the scale</h2><p className="mt-1 text-xs font-semibold leading-5 text-[#5d6b79]">Enter the weight shown while you are holding the bag.</p></div>
                  <span className="shrink-0 rounded-full border border-white bg-[#fce8f2] px-3 py-1.5 text-xs font-bold text-[#71306c]">{plan.baggage.bags.length} {plan.baggage.bags.length === 1 ? "bag" : "bags"}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {plan.baggage.bags.map((bag, index) => {
                    const bagWeight = bagWeights[index];
                    const hasCombinedWeight = bag.combinedWeight > 0;
                    const invalidWeight = personWeight > 0 && hasCombinedWeight && bag.combinedWeight < personWeight;
                    const displayName = bag.name.trim() || `Bag ${index + 1}`;
                    const theme = bagThemes[index % bagThemes.length];
                    return (
                      <div key={bag.id} className={`relative overflow-hidden rounded-[24px] border p-4 pt-5 ${theme.card}`}>
                        <div aria-hidden="true" className={`absolute inset-x-0 top-0 h-1.5 ${theme.stripe}`} />
                        <div aria-hidden="true" className={`absolute -right-12 -top-12 size-32 rounded-full ${theme.orb}`} />
                        <div className="relative flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className={`relative grid size-12 shrink-0 place-items-center rounded-[17px] border-2 border-white/90 ${theme.badge}`}><Luggage className="size-6" /><span className={`absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border-2 border-white bg-white font-[Manrope] text-[10px] font-extrabold ${theme.accent}`}>{index + 1}</span></span>
                            <div className="min-w-0"><p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${theme.accent}`}>Bag {index + 1}</p><p className="truncate font-[Manrope] text-base font-extrabold text-[#17344f]">You + {displayName}</p></div>
                          </div>
                          {plan.baggage.bags.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${displayName}`} className="size-11 shrink-0 rounded-[13px] text-[#a62d57] transition-colors hover:bg-[#fce8f2] hover:text-[#a62d57]" onClick={() => setPlan((current) => ({ ...current, baggage: { ...current.baggage, bags: current.baggage.bags.filter((item) => item.id !== bag.id) } }))}><Trash2 className="size-4" /></Button>}
                        </div>
                        <div className="relative mt-4 grid gap-3 rounded-[19px] border border-white/80 bg-white/55 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-sm">
                          <Field label="Bag name"><div className="relative"><PencilLine className={`pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 ${theme.accent}`} /><Input value={bag.name} maxLength={40} onChange={(event) => setPlan((current) => ({ ...current, baggage: { ...current.baggage, bags: current.baggage.bags.map((item) => item.id === bag.id ? { ...item, name: event.target.value } : item) } }))} placeholder={`Bag ${index + 1}`} className={`${fieldClass} border-white/90 bg-white/80 pl-10 font-semibold`} /></div></Field>
                          <Field label={`Scale reading with ${displayName} (kg)`}><Input type="number" inputMode="decimal" min="0" step="0.1" value={bag.combinedWeight || ""} onChange={(event) => setPlan((current) => ({ ...current, baggage: { ...current.baggage, bags: current.baggage.bags.map((item) => item.id === bag.id ? { ...item, combinedWeight: toNonNegativeNumber(event.target.value) } : item) } }))} placeholder="e.g. 82.5" className={`${fieldClass} border-white/90 bg-white/80 font-bold`} /></Field>
                        </div>
                        <div className={`relative mt-3 rounded-2xl border px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] ${invalidWeight ? "border-[#edc4d6] bg-[#fce8f2] text-[#a62d57]" : theme.result}`}>
                          {!personWeight ? <p className="text-xs font-bold">Enter your weight in Step 1 first.</p> : !hasCombinedWeight ? <p className="text-xs font-bold">Now weigh yourself while holding {displayName}.</p> : invalidWeight ? <p className="text-xs font-bold">This must be at least your body weight.</p> : <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold">{bag.combinedWeight.toFixed(1)} − {personWeight.toFixed(1)}</p><p className="text-right text-sm font-black">{displayName}: {bagWeight.toFixed(1)} kg</p></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button type="button" variant="outline" onClick={addBag} className={`${secondaryButtonClass} mt-4 w-full`}><Plus className="size-4" /> Add another bag</Button>
              </section>

              <section className="rounded-[24px] border border-[#ccebdc] bg-[#e1f6ec] p-4 shadow-[0_10px_26px_rgba(40,91,78,0.05)] sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#71306c]">Total baggage</p><p className="mt-1 font-[Manrope] text-3xl font-extrabold tracking-[-0.8px] text-[#17344f]">{totalBagWeight.toFixed(1)} <span className="text-base text-[#5d6b79]">kg</span></p></div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${baggageRemaining < 0 ? "bg-[#fce8f2] text-[#a62d57]" : "bg-white/80 text-[#086553]"}`}>{baggageRemaining < 0 ? `${Math.abs(baggageRemaining).toFixed(1)} kg over` : `${baggageRemaining.toFixed(1)} kg left`}</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-[19px] border border-white/80 bg-white/55 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <div className="shrink-0"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#71306c]">Your bags</p><p className="mt-0.5 text-xs font-bold text-[#426f5e]">{plan.baggage.bags.length} in this total</p></div>
                  <div className="bag-icon-parade" role="img" aria-label={`${plan.baggage.bags.length} ${plan.baggage.bags.length === 1 ? "bag" : "bags"} included in the total`}>
                    {plan.baggage.bags.map((bag, index) => {
                      const theme = bagThemes[index % bagThemes.length];
                      return (
                        <span key={bag.id} className={`bag-total-icon ${theme.badge}`} style={{ "--bag-index": index } as React.CSSProperties} title={bag.name.trim() || `Bag ${index + 1}`}>
                          <Luggage className="size-5" />
                          <span className={`absolute -right-1 -top-1 grid size-[18px] place-items-center rounded-full border-2 border-white bg-white font-[Manrope] text-[9px] font-extrabold ${theme.accent}`}>{index + 1}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
                <Progress value={baggagePercent} className={`mt-4 h-3 bg-white/80 ${baggageRemaining < 0 ? "[&>div]:bg-[#a62d57]" : "[&>div]:bg-[#117d67]"}`} />
                <p className="mt-2 text-xs font-bold text-[#426f5e]">Allowance: {plan.baggage.checkedAllowance.toFixed(1)} kg</p>
              </section>
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        <button type="button" className={tab === "flights" ? "active" : ""} aria-current={tab === "flights" ? "page" : undefined} onClick={() => changeTab("flights")}><PlaneTakeoff className="size-[21px]" /><span>Flights</span></button>
        <button type="button" className={tab === "packing" ? "active" : ""} aria-current={tab === "packing" ? "page" : undefined} onClick={() => changeTab("packing")}><Check className="size-[21px]" /><span>Checklist</span></button>
        <button type="button" className={tab === "baggage" ? "active" : ""} aria-current={tab === "baggage" ? "page" : undefined} onClick={() => changeTab("baggage")}><Luggage className="size-[21px]" /><span>Baggage</span></button>
      </nav>
    </div>
  );
}
