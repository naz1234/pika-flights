"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CirclePlus,
  Cloud,
  CloudOff,
  Luggage,
  MapPin,
  Minus,
  PackageCheck,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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

type BagType = "cabin" | "checked";

type BaggageItem = {
  id: string;
  label: string;
  weight: number;
  quantity: number;
  bag: BagType;
};

type PlanState = {
  tripName: string;
  traveler: string;
  flights: Flight[];
  packing: PackingItem[];
  baggage: {
    cabinAllowance: number;
    checkedAllowance: number;
    items: BaggageItem[];
  };
};

const categories = ["Documents", "Clothes", "Toiletries", "Tech", "Health", "Comfort"];

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
    cabinAllowance: 7,
    checkedAllowance: 20,
    items: [],
  },
};

const fieldClass =
  "h-11 rounded-2xl border-[#cdeafa] bg-white/95 text-[#153454] shadow-[0_4px_14px_rgba(29,143,202,0.06)] placeholder:text-[#7ca5bd] focus-visible:border-[#45bce9] focus-visible:ring-[#9ce4fb]";

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
    <label className={`grid gap-1.5 text-xs font-bold text-[#52738b] ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function WeightSummary({
  title,
  icon,
  total,
  allowance,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  total: number;
  allowance: number;
  tone: "blue" | "coral";
}) {
  const remaining = allowance - total;
  const percent = allowance > 0 ? Math.min((total / allowance) * 100, 100) : 0;
  const over = remaining < 0;
  const color = tone === "blue" ? "text-[#087fbd]" : "text-[#ed4f72]";

  return (
    <div className="rounded-3xl bg-white/90 p-4 shadow-[0_10px_28px_rgba(29,143,202,0.08)] ring-1 ring-[#d4eef9]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`grid size-9 place-items-center rounded-2xl bg-white ${color}`}>{icon}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b91a7]">{title}</p>
            <p className="mt-0.5 text-lg font-extrabold text-[#14365d]">
              {total.toFixed(1)} <span className="text-xs font-bold text-[#7898aa]">/ {allowance || 0} kg</span>
            </p>
          </div>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-extrabold ${over ? "bg-[#ffe1e8] text-[#d73f61]" : "bg-[#dcf7ff] text-[#0879a9]"}`}>
          {over ? `${Math.abs(remaining).toFixed(1)} kg over` : `${remaining.toFixed(1)} kg left`}
        </div>
      </div>
      <Progress value={percent} className={`mt-3 h-2 bg-[#e7f6fb] ${over ? "[&>div]:bg-[#ef5a78]" : "[&>div]:bg-[#22aede]"}`} />
    </div>
  );
}

export default function Home() {
  const [plan, setPlan] = useState<PlanState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"loading" | "saving" | "saved" | "offline">("loading");
  const [newPackingItem, setNewPackingItem] = useState("");
  const [newPackingCategory, setNewPackingCategory] = useState(categories[0]);
  const [newBagItem, setNewBagItem] = useState("");
  const [newBagWeight, setNewBagWeight] = useState(0);
  const [newBagType, setNewBagType] = useState<BagType>("checked");
  const [clock, setClock] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPlan() {
      try {
        const response = await fetch("/api/state", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Load failed");
        const payload = (await response.json()) as { data: PlanState | null };
        if (payload.data) setPlan(payload.data);
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
  const baggageTotals = plan.baggage.items.reduce(
    (totals, item) => {
      totals[item.bag] += Number(item.weight || 0) * Number(item.quantity || 0);
      return totals;
    },
    { cabin: 0, checked: 0 }
  );

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

  function addBaggageItem() {
    const label = newBagItem.trim();
    if (!label || newBagWeight <= 0) return;
    setPlan((current) => ({
      ...current,
      baggage: {
        ...current.baggage,
        items: [...current.baggage.items, { id: makeId(), label, weight: newBagWeight, quantity: 1, bag: newBagType }],
      },
    }));
    setNewBagItem("");
    setNewBagWeight(0);
  }

  return (
    <main className="min-h-dvh bg-[#dff5ff] text-[#153454]">
      <div className="mx-auto min-h-dvh max-w-4xl overflow-hidden bg-[radial-gradient(circle_at_top_left,_#ffffff_0,_#eaf8ff_45%,_#fff1f6_100%)] md:my-5 md:min-h-[calc(100dvh-40px)] md:rounded-[2.5rem] md:shadow-2xl md:shadow-sky-300/35 md:ring-1 md:ring-white/90">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#d7eff9] bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <div className="relative size-12 overflow-hidden rounded-[1.15rem] bg-white shadow-lg shadow-sky-200/70 ring-2 ring-white">
              <Image src="/icon-192.png" alt="Pika Flights" fill sizes="48px" className="object-cover" priority />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#f25789]">Pika</p>
              <h1 className="text-lg font-black tracking-tight text-[#0c2d59]">Flights</h1>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${saveState === "offline" ? "bg-[#ffe5eb] text-[#d84464]" : "bg-[#e3f7ff] text-[#087cb6]"}`} aria-live="polite">
            {saveState === "offline" ? <CloudOff className="size-3.5" /> : saveState === "saved" ? <Cloud className="size-3.5" /> : <RotateCcw className="size-3.5 animate-spin" />}
            {saveState === "loading" ? "Loading" : saveState === "saving" ? "Saving" : saveState === "offline" ? "Offline" : "Synced"}
          </div>
        </header>

        <Tabs defaultValue="flights" className="relative min-h-[calc(100dvh-68px)]">
          <div className="px-4 pb-28 pt-5 sm:px-7 sm:pb-32">
            <TabsContent value="flights" className="m-0 space-y-5">
              <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0b2f66] via-[#116db8] to-[#35bce9] p-5 text-white shadow-xl shadow-sky-300/45 sm:p-7">
                <div className="absolute -right-9 -top-12 size-40 rounded-full border-[22px] border-white/10" />
                <div className="absolute -bottom-14 left-10 size-32 rounded-full bg-[#ff7298]/30 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] ring-1 ring-white/20">Next journey</span>
                    <PlaneTakeoff className="size-6 text-[#ffd165]" />
                  </div>
                  <Input aria-label="Trip name" value={plan.tripName} onChange={(event) => setPlan((current) => ({ ...current, tripName: event.target.value }))} className="mt-6 h-auto border-0 bg-transparent px-0 text-2xl font-black tracking-tight text-white shadow-none placeholder:text-white/50 focus-visible:ring-0 sm:text-3xl" placeholder="Name your trip" />
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-2xl font-black tracking-[0.08em] sm:text-3xl">{routeLabel}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white/75"><CalendarDays className="size-4" /> {countdown}</p>
                    </div>
                    <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ff6786] text-white shadow-lg shadow-[#0c315e]/20 ring-1 ring-white/30"><MapPin className="size-5" /></div>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] bg-[#e8f8ff] p-4 shadow-sm ring-1 ring-[#c4eaf9] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1599d1]">Traveller</p><h2 className="mt-1 text-xl font-black text-[#102f58]">Who is flying?</h2></div>
                  <div className="grid size-11 place-items-center rounded-2xl bg-white text-[#0a84c3] shadow-sm ring-1 ring-[#d5f0fa]"><BriefcaseBusiness className="size-5" /></div>
                </div>
                <Input aria-label="Traveller names" placeholder="Traveller name(s)" value={plan.traveler} onChange={(event) => setPlan((current) => ({ ...current, traveler: event.target.value }))} className={`${fieldClass} mt-4`} />
              </section>

              {plan.flights.map((flight, index) => (
                <section key={flight.id} className="rounded-[2rem] bg-[#edf8ff] p-4 shadow-sm ring-1 ring-[#c7eafa] sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-2xl bg-[#0d3a70] text-sm font-black text-white shadow-md shadow-sky-200">{index + 1}</span>
                      <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1397d0]">Flight segment</p><h2 className="text-lg font-black text-[#102f58]">{flight.from || "From"} <ArrowRight className="mx-1 inline size-4 text-[#f45f7e]" /> {flight.to || "To"}</h2></div>
                    </div>
                    {plan.flights.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label={`Remove flight ${index + 1}`} className="rounded-xl text-[#82a3b6] hover:bg-[#ffe7ed] hover:text-[#e54868]" onClick={() => setPlan((current) => ({ ...current, flights: current.flights.filter((item) => item.id !== flight.id) }))}><Trash2 /></Button>}
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
                    <Field label="Notes" className="col-span-2 sm:col-span-4"><Textarea value={flight.notes} onChange={(event) => updateFlight(flight.id, { notes: event.target.value })} placeholder="Check-in, transfer or pickup notes…" className="min-h-20 rounded-2xl border-[#cdeafa] bg-white/95 text-[#153454] shadow-none placeholder:text-[#7ca5bd] focus-visible:ring-[#9ce4fb]" /></Field>
                  </div>
                </section>
              ))}

              <Button type="button" variant="outline" className="h-12 w-full rounded-2xl border-dashed border-[#53bce5] bg-white/80 font-extrabold text-[#0b6fa8] hover:bg-[#e4f7ff]" onClick={() => setPlan((current) => ({ ...current, flights: [...current.flights, emptyFlight()] }))}><CirclePlus className="size-5" /> Add another flight</Button>
            </TabsContent>

            <TabsContent value="packing" className="m-0 space-y-5">
              <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#087fbd] via-[#16a9d4] to-[#43d4e7] p-5 text-white shadow-xl shadow-sky-300/45 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/75">Packing progress</p><h2 className="mt-1 text-3xl font-black">{packedCount} of {plan.packing.length}</h2><p className="mt-1 text-sm font-semibold text-white/80">items are safely in your bag</p></div>
                  <div className="grid size-16 place-items-center rounded-[1.6rem] bg-white/20 ring-1 ring-white/25"><PackageCheck className="size-8" /></div>
                </div>
                <Progress value={packingPercent} className="mt-5 h-3 bg-white/25 [&>div]:bg-white" />
              </section>

              <section className="rounded-[2rem] bg-[#ecfaff] p-4 ring-1 ring-[#c4ebf9] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#098fc9]">Your list</p><h2 className="mt-1 text-xl font-black text-[#102f58]">Ready, set, pack</h2></div>
                  {packedCount > 0 && <Button type="button" variant="ghost" size="sm" className="rounded-xl text-xs font-bold text-[#0879ad] hover:bg-white/80" onClick={() => setPlan((current) => ({ ...current, packing: current.packing.map((item) => ({ ...item, checked: false })) }))}>Reset</Button>}
                </div>
                <div className="mt-5 space-y-5">
                  {categories.map((category) => {
                    const items = plan.packing.filter((item) => item.category === category);
                    if (!items.length) return null;
                    return (
                      <div key={category}>
                        <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.13em] text-[#6a90a7]"><span>{category}</span><span className="h-px flex-1 bg-[#bde8f8]" /></div>
                        <div className="overflow-hidden rounded-2xl bg-white/90 ring-1 ring-[#d8f0f9]">
                          {items.map((item) => (
                            <div key={item.id} className="group flex min-h-12 items-center gap-3 border-b border-[#e6f6fb] px-3 last:border-0">
                              <Checkbox id={item.id} checked={item.checked} onCheckedChange={(checked) => setPlan((current) => ({ ...current, packing: current.packing.map((packingItem) => packingItem.id === item.id ? { ...packingItem, checked: checked === true } : packingItem) }))} className="size-5 rounded-md border-[#63c6e9] data-[state=checked]:border-[#149bd0] data-[state=checked]:bg-[#149bd0]" />
                              <label htmlFor={item.id} className={`flex-1 cursor-pointer py-3 text-sm font-semibold ${item.checked ? "text-[#8fa9b7] line-through" : "text-[#294d69]"}`}>{item.label}</label>
                              <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${item.label}`} className="size-8 rounded-lg text-[#abc2cf] opacity-100 hover:bg-[#ffe7ed] hover:text-[#e54868] sm:opacity-0 sm:group-hover:opacity-100" onClick={() => setPlan((current) => ({ ...current, packing: current.packing.filter((packingItem) => packingItem.id !== item.id) }))}><Trash2 className="size-4" /></Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[2rem] bg-[#fff5d8] p-4 ring-1 ring-[#ffe29a] sm:p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#c97905]">Add your own</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px_auto]">
                  <Input value={newPackingItem} onChange={(event) => setNewPackingItem(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addPackingItem()} placeholder="e.g. Sunglasses" className={fieldClass} />
                  <NativeSelect value={newPackingCategory} onChange={(event) => setNewPackingCategory(event.target.value)} className="h-11 rounded-2xl border-[#ffe3a0] bg-white/90 font-semibold" aria-label="Packing category">{categories.map((category) => <NativeSelectOption key={category} value={category}>{category}</NativeSelectOption>)}</NativeSelect>
                  <Button type="button" onClick={addPackingItem} className="h-11 rounded-2xl bg-[#ff9e2f] font-extrabold text-white shadow-md shadow-orange-200 hover:bg-[#ef8c20]"><Plus /> Add</Button>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="baggage" className="m-0 space-y-5">
              <section className="rounded-[2rem] bg-gradient-to-br from-[#f05272] via-[#ff6685] to-[#ff77a5] p-5 text-white shadow-xl shadow-pink-300/45 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/80">Baggage calculator</p><h2 className="mt-1 text-3xl font-black">Pack within limit</h2><p className="mt-1 text-sm font-semibold text-white/80">Add each item and we’ll total it for you.</p></div>
                  <div className="grid size-16 place-items-center rounded-[1.6rem] bg-white/20 ring-1 ring-white/25"><Luggage className="size-8" /></div>
                </div>
              </section>

              <section className="rounded-[2rem] bg-[#fff0f5] p-4 ring-1 ring-[#ffd4e0] sm:p-6">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cabin allowance (kg)"><Input type="number" min="0" step="0.1" value={plan.baggage.cabinAllowance} onChange={(event) => setPlan((current) => ({ ...current, baggage: { ...current.baggage, cabinAllowance: Number(event.target.value) } }))} className={fieldClass} /></Field>
                  <Field label="Checked allowance (kg)"><Input type="number" min="0" step="0.1" value={plan.baggage.checkedAllowance} onChange={(event) => setPlan((current) => ({ ...current, baggage: { ...current.baggage, checkedAllowance: Number(event.target.value) } }))} className={fieldClass} /></Field>
                </div>
                <div className="mt-4 grid gap-3">
                  <WeightSummary title="Cabin bag" icon={<BriefcaseBusiness className="size-5" />} total={baggageTotals.cabin} allowance={plan.baggage.cabinAllowance} tone="blue" />
                  <WeightSummary title="Checked bag" icon={<Luggage className="size-5" />} total={baggageTotals.checked} allowance={plan.baggage.checkedAllowance} tone="coral" />
                </div>
              </section>

              <section className="rounded-[2rem] bg-[#edf8ff] p-4 ring-1 ring-[#c7eafa] sm:p-6">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1397d0]">Weight list</p><h2 className="mt-1 text-xl font-black text-[#102f58]">What is in your bags?</h2></div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#0b79b2]">{plan.baggage.items.length} items</span>
                </div>
                <div className="mt-4 space-y-2">
                  {plan.baggage.items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#83d2ef] bg-white/65 px-5 py-8 text-center"><Luggage className="mx-auto size-7 text-[#55bbe0]" /><p className="mt-2 text-sm font-bold text-[#63849a]">Add your first item below</p></div>
                  ) : plan.baggage.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-white/90 p-3 ring-1 ring-[#d8f0f9] sm:grid-cols-[1fr_118px_118px_auto]">
                      <div className="min-w-0"><p className="truncate text-sm font-extrabold text-[#153454]">{item.label}</p><button type="button" className="mt-1 flex items-center gap-1 text-xs font-bold text-[#118dc5]" onClick={() => setPlan((current) => ({ ...current, baggage: { ...current.baggage, items: current.baggage.items.map((bagItem) => bagItem.id === item.id ? { ...bagItem, bag: bagItem.bag === "cabin" ? "checked" : "cabin" } : bagItem) } }))}>{item.bag === "cabin" ? "Cabin bag" : "Checked bag"} <ChevronDown className="size-3" /></button></div>
                      <div className="flex items-center justify-end gap-1 sm:order-4"><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${item.label}`} className="size-9 rounded-xl text-[#82a3b6] hover:bg-[#ffe7ed] hover:text-[#e54868]" onClick={() => setPlan((current) => ({ ...current, baggage: { ...current.baggage, items: current.baggage.items.filter((bagItem) => bagItem.id !== item.id) } }))}><Trash2 className="size-4" /></Button></div>
                      <div className="flex items-center justify-between rounded-xl bg-[#e4f7ff] px-2 py-1.5 text-[#16496c]">
                        <Button type="button" variant="ghost" size="icon" aria-label={`Decrease ${item.label} quantity`} className="size-7 rounded-lg" onClick={() => setPlan((current) => ({ ...current, baggage: { ...current.baggage, items: current.baggage.items.map((bagItem) => bagItem.id === item.id ? { ...bagItem, quantity: Math.max(1, bagItem.quantity - 1) } : bagItem) } }))}><Minus className="size-3" /></Button>
                        <span className="text-xs font-black">× {item.quantity}</span>
                        <Button type="button" variant="ghost" size="icon" aria-label={`Increase ${item.label} quantity`} className="size-7 rounded-lg" onClick={() => setPlan((current) => ({ ...current, baggage: { ...current.baggage, items: current.baggage.items.map((bagItem) => bagItem.id === item.id ? { ...bagItem, quantity: bagItem.quantity + 1 } : bagItem) } }))}><Plus className="size-3" /></Button>
                      </div>
                      <div className="rounded-xl bg-[#ffe7ee] px-3 py-2 text-center text-xs font-black text-[#df4668]">{(item.weight * item.quantity).toFixed(1)} kg</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-[#fff5d8] p-4 ring-1 ring-[#ffe29a] sm:p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#c97905]">Add baggage item</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_110px_130px_auto]">
                  <Input value={newBagItem} onChange={(event) => setNewBagItem(event.target.value)} placeholder="e.g. Suitcase" className={fieldClass} />
                  <Input type="number" min="0" step="0.1" value={newBagWeight || ""} onChange={(event) => setNewBagWeight(Number(event.target.value))} placeholder="kg" className={fieldClass} aria-label="Item weight in kilograms" />
                  <NativeSelect value={newBagType} onChange={(event) => setNewBagType(event.target.value as BagType)} className="h-11 rounded-2xl border-[#ffe3a0] bg-white/90 font-semibold" aria-label="Bag type"><NativeSelectOption value="cabin">Cabin bag</NativeSelectOption><NativeSelectOption value="checked">Checked bag</NativeSelectOption></NativeSelect>
                  <Button type="button" onClick={addBaggageItem} className="h-11 rounded-2xl bg-[#ff9e2f] font-extrabold text-white shadow-md shadow-orange-200 hover:bg-[#ef8c20]"><Plus /> Add</Button>
                </div>
              </section>
            </TabsContent>
          </div>

          <TabsList className="fixed inset-x-3 bottom-3 z-40 mx-auto h-[72px] w-auto max-w-[520px] rounded-[1.6rem] border border-[#d6eff9] bg-white/95 p-2 shadow-2xl shadow-sky-300/35 backdrop-blur-xl md:absolute md:bottom-5">
            <TabsTrigger value="flights" className="h-full flex-col gap-1 rounded-[1.1rem] text-[11px] font-extrabold text-[#638399] data-[state=active]:bg-[#dff5ff] data-[state=active]:text-[#087bb6] data-[state=active]:shadow-none"><PlaneTakeoff className="size-5" /> Flights</TabsTrigger>
            <TabsTrigger value="packing" className="h-full flex-col gap-1 rounded-[1.1rem] text-[11px] font-extrabold text-[#638399] data-[state=active]:bg-[#daf8fb] data-[state=active]:text-[#087e9f] data-[state=active]:shadow-none"><Check className="size-5" /> Checklist</TabsTrigger>
            <TabsTrigger value="baggage" className="h-full flex-col gap-1 rounded-[1.1rem] text-[11px] font-extrabold text-[#638399] data-[state=active]:bg-[#ffe5ed] data-[state=active]:text-[#df4568] data-[state=active]:shadow-none"><Luggage className="size-5" /> Baggage</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </main>
  );
}
