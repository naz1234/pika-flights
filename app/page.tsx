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

type BagMeasurement = {
  id: string;
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
    bags: [{ id: "starter-bag-1", combinedWeight: 0 }],
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
    .map((bag) => ({
      id: typeof bag.id === "string" ? bag.id : makeId(),
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
      bags: bags.length ? bags : [{ id: makeId(), combinedWeight: 0 }],
    },
  };
}

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
    <label className={`grid min-w-0 max-w-full gap-1.5 text-xs font-bold text-[#52738b] ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function Home() {
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
        bags: [...current.baggage.bags, { id: makeId(), combinedWeight: 0 }],
      },
    }));
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#dff5ff] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-[#153454] md:p-5">
      <div className="mx-auto flex h-full min-h-0 max-w-4xl flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_#ffffff_0,_#eaf8ff_45%,_#fff1f6_100%)] md:rounded-[2.5rem] md:shadow-2xl md:shadow-sky-300/35 md:ring-1 md:ring-white/90">
        <header className="relative z-30 flex shrink-0 items-center justify-between border-b border-[#d7eff9] bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-7 md:rounded-t-[2.5rem]">
          <div className="flex items-center gap-3">
            <div className="relative size-12 overflow-hidden rounded-[1.15rem] bg-white shadow-lg shadow-sky-200/70 ring-2 ring-white">
              <span role="img" aria-label="Pika Flights" className="block size-full bg-cover bg-center" style={{ backgroundImage: "url('/icon-192.png')" }} />
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

        <Tabs defaultValue="flights" className="relative min-h-0 flex-1 overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 pt-5 sm:px-7 sm:pb-7">
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
                  <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/80">Baggage calculator</p><h2 className="mt-1 text-3xl font-black">Weigh every bag</h2><p className="mt-1 text-sm font-semibold text-white/80">Use any body-weight scale—no luggage scale needed.</p></div>
                  <div className="grid size-16 place-items-center rounded-[1.6rem] bg-white/20 ring-1 ring-white/25"><Luggage className="size-8" /></div>
                </div>
              </section>

              <section className="rounded-[2rem] bg-[#fff0f5] p-4 ring-1 ring-[#ffd4e0] sm:p-6">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#e24e72]">Step 1</p>
                  <h2 className="mt-1 text-xl font-black text-[#102f58]">Weigh yourself first</h2>
                  <p className="mt-1 text-sm font-semibold leading-5 text-[#6c8ba0]">Stand on the scale without a bag and enter your weight.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Your weight (kg)" className="mt-4"><Input type="number" inputMode="decimal" min="0" step="0.1" value={plan.baggage.personWeight || ""} onChange={(event) => setPlan((current) => ({ ...current, baggage: { ...current.baggage, personWeight: toNonNegativeNumber(event.target.value) } }))} placeholder="e.g. 70" className={fieldClass} /></Field>
                  <Field label="Baggage allowance (kg)" className="mt-4"><Input type="number" inputMode="decimal" min="0" step="0.1" value={plan.baggage.checkedAllowance || ""} onChange={(event) => setPlan((current) => ({ ...current, baggage: { ...current.baggage, checkedAllowance: toNonNegativeNumber(event.target.value) } }))} placeholder="e.g. 20" className={fieldClass} /></Field>
                </div>
              </section>

              <section className="rounded-[2rem] bg-[#edf8ff] p-4 ring-1 ring-[#c7eafa] sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1397d0]">Step 2</p><h2 className="mt-1 text-xl font-black text-[#102f58]">Hold each bag on the scale</h2><p className="mt-1 text-sm font-semibold leading-5 text-[#6c8ba0]">Enter the weight shown while you are holding the bag.</p></div>
                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#0b79b2]">{plan.baggage.bags.length} {plan.baggage.bags.length === 1 ? "bag" : "bags"}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {plan.baggage.bags.map((bag, index) => {
                    const bagWeight = bagWeights[index];
                    const hasCombinedWeight = bag.combinedWeight > 0;
                    const invalidWeight = personWeight > 0 && hasCombinedWeight && bag.combinedWeight < personWeight;
                    return (
                      <div key={bag.id} className="rounded-3xl bg-white/90 p-4 shadow-[0_8px_24px_rgba(29,143,202,0.08)] ring-1 ring-[#d8f0f9]">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-2xl bg-[#0d3a70] text-sm font-black text-white">{index + 1}</span><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#1397d0]">Bag {index + 1}</p><p className="text-sm font-black text-[#153454]">You + Bag {index + 1}</p></div></div>
                          {plan.baggage.bags.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label={`Remove Bag ${index + 1}`} className="size-9 rounded-xl text-[#82a3b6] hover:bg-[#ffe7ed] hover:text-[#e54868]" onClick={() => setPlan((current) => ({ ...current, baggage: { ...current.baggage, bags: current.baggage.bags.filter((item) => item.id !== bag.id) } }))}><Trash2 className="size-4" /></Button>}
                        </div>
                        <Field label={`Scale reading with Bag ${index + 1} (kg)`} className="mt-4"><Input type="number" inputMode="decimal" min="0" step="0.1" value={bag.combinedWeight || ""} onChange={(event) => setPlan((current) => ({ ...current, baggage: { ...current.baggage, bags: current.baggage.bags.map((item) => item.id === bag.id ? { ...item, combinedWeight: toNonNegativeNumber(event.target.value) } : item) } }))} placeholder="e.g. 82.5" className={fieldClass} /></Field>
                        <div className={`mt-3 rounded-2xl px-3 py-2.5 ${invalidWeight ? "bg-[#ffe5ec] text-[#d94163]" : "bg-[#e2f7ff] text-[#0b76a9]"}`}>
                          {!personWeight ? <p className="text-xs font-bold">Enter your weight in Step 1 first.</p> : !hasCombinedWeight ? <p className="text-xs font-bold">Now weigh yourself while holding Bag {index + 1}.</p> : invalidWeight ? <p className="text-xs font-bold">This must be at least your body weight.</p> : <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold">{bag.combinedWeight.toFixed(1)} − {personWeight.toFixed(1)}</p><p className="text-sm font-black">Bag {index + 1}: {bagWeight.toFixed(1)} kg</p></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button type="button" variant="outline" onClick={addBag} className="mt-4 h-11 w-full rounded-2xl border-dashed border-[#53bce5] bg-white/80 font-extrabold text-[#0b6fa8] hover:bg-[#e4f7ff]"><Plus className="size-4" /> Add another bag</Button>
              </section>

              <section className="rounded-[2rem] bg-[#fff5d8] p-4 ring-1 ring-[#ffe29a] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#c97905]">Total baggage</p><p className="mt-1 text-3xl font-black text-[#102f58]">{totalBagWeight.toFixed(1)} <span className="text-base text-[#6c8ba0]">kg</span></p></div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${baggageRemaining < 0 ? "bg-[#ffe1e8] text-[#d73f61]" : "bg-[#dcf7ff] text-[#0879a9]"}`}>{baggageRemaining < 0 ? `${Math.abs(baggageRemaining).toFixed(1)} kg over` : `${baggageRemaining.toFixed(1)} kg left`}</span>
                </div>
                <Progress value={baggagePercent} className={`mt-4 h-3 bg-white/70 ${baggageRemaining < 0 ? "[&>div]:bg-[#ef5a78]" : "[&>div]:bg-[#22aede]"}`} />
                <p className="mt-2 text-xs font-bold text-[#8a7954]">Allowance: {plan.baggage.checkedAllowance.toFixed(1)} kg</p>
              </section>
            </TabsContent>
          </div>

          <TabsList className="relative inset-auto z-40 mx-auto mb-3 h-[72px] w-[calc(100%-1.5rem)] max-w-[520px] shrink-0 self-center rounded-[1.6rem] border border-[#d6eff9] bg-white/95 p-2 shadow-2xl shadow-sky-300/35 backdrop-blur-xl md:mb-0">
            <TabsTrigger value="flights" className="h-full flex-col gap-1 rounded-[1.1rem] text-[11px] font-extrabold text-[#638399] data-[state=active]:bg-[#dff5ff] data-[state=active]:text-[#087bb6] data-[state=active]:shadow-none"><PlaneTakeoff className="size-5" /> Flights</TabsTrigger>
            <TabsTrigger value="packing" className="h-full flex-col gap-1 rounded-[1.1rem] text-[11px] font-extrabold text-[#638399] data-[state=active]:bg-[#daf8fb] data-[state=active]:text-[#087e9f] data-[state=active]:shadow-none"><Check className="size-5" /> Checklist</TabsTrigger>
            <TabsTrigger value="baggage" className="h-full flex-col gap-1 rounded-[1.1rem] text-[11px] font-extrabold text-[#638399] data-[state=active]:bg-[#ffe5ed] data-[state=active]:text-[#df4568] data-[state=active]:shadow-none"><Luggage className="size-5" /> Baggage</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </main>
  );
}
