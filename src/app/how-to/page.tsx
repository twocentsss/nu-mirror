"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { PromotionalReel } from '@/ui/PromotionalReel';

const LIFE_STAGES = [
  {
    age: "18",
    title: "The Ambitious Beginner",
    promise: "Stop falling behind. Start stacking wins.",
    provocation: "Why wait to be someone your future self thanks?",
    useCases: [
      { focus: "Body & Energy", want: "Sleep better and stop feeling wiped by 3pm.", delivery: "Auto-schedule wind-down reminders + nightly sleep score with 'today's experiment' tweaks." },
      { focus: "Focus & Mind", want: "Sustain a study session that doesn’t collapse after 20 minutes.", delivery: "One-tap 90-minute study flow that blocks distractions and auto-saves flashcards." },
      { focus: "Career & Work", want: "Keep up with assignments so I’m not scrambling on Sunday.", delivery: "Capture 'exam, paper, lab' in one line → Nu auto-splits into timed study sessions." },
      { focus: "Learning", want: "Actually learn, not just cram.", delivery: "Convert notes into weekly micro-practice tasks; remind until mastery." },
      { focus: "Side Projects", want: "Ship something small to show I can.", delivery: "Turn a fleeting idea into a 3-step MVP checklist and reserve three 45-minute slots." },
      { focus: "Relationships", want: "Be reliable — don’t ghost friends or crushes.", delivery: "One-line 'date with Sam' becomes a plan reminder and suggested message starters." },
      { focus: "Family", want: "Not let family stuff pile up and get yelled at.", delivery: "Auto-sync shared events + one daily 'two-minute check-in' prompt." },
      { focus: "Social Life", want: "Feel connected without exhausting coordination.", delivery: "Suggest micro-plans ('coffee Friday') based on mutual free windows." },
      { focus: "Rest & Joy", want: "Do the things that don’t feel like productivity.", delivery: "Weekly reminder for creative 'wins' (draw/jam) and track it as momentum." },
    ]
  },
  {
    age: "24",
    title: "The Transitioner",
    promise: "Experiment boldly. Keep your life intact.",
    provocation: "Why wait to experiment when you can test and keep your life intact?",
    useCases: [
      { focus: "Body & Energy", want: "Keep my energy consistent so I can perform at work.", delivery: "Energy budget that schedules workouts/sleep around meetings and warns of drain." },
      { focus: "Focus & Mind", want: "Ship work, but also learn without burnout.", delivery: "Weekly 'context blocks' that group deep work and learning; auto-adjust if meetings creep." },
      { focus: "Career & Work", want: "Make measurable progress toward promotion or pivot.", delivery: "Evidence cards mapping monthly milestones to quarterly goals for performance reviews." },
      { focus: "Learning", want: "Build skills without losing weeks to nothing.", delivery: "Learning lanes: 15-minute daily micro-tasks tied to a certification or sample project." },
      { focus: "Side Projects", want: "Try a startup or side hustle without tanking my job.", delivery: "Low-friction 'experiment sprints' (3 weeks, 3 metrics) with reserved repeatable time slots." },
      { focus: "Relationships", want: "Date intentionally and keep commitments.", delivery: "Auto-schedule 'relationship anchors' (text, date, check-in) + anniversary gestures." },
      { focus: "Family", want: "Be present for family without guilt.", delivery: "Family mode: consolidate obligations + suggested call times based on shared events." },
      { focus: "Social Life", want: "Keep friendships alive even when life is busy.", delivery: "Smart micro-invitations + rolling 'friend-priority' list for right-time reach-outs." },
      { focus: "Rest & Joy", want: "Do the fun things you actually enjoy — not one-offs.", delivery: "Habit bundling: tie a hobby (guitar 20m) to a reward and auto-book the slot." },
    ]
  },
  {
    age: "34",
    title: "The Responsible",
    promise: "Protect your energy. Own your week.",
    provocation: "Why wait to make this decade the one you didn’t have to recover from?",
    useCases: [
      { focus: "Body & Energy", want: "Maintain fitness without losing evenings to logistics.", delivery: "Family-aware workouts: auto-schedule sessions that align with childcare windows." },
      { focus: "Focus & Mind", want: "Get meaningful deep work amid interruptions.", delivery: "'Sanctuary' blocks protect deep time, silence pings, and summarize achievements." },
      { focus: "Career & Work", want: "Deliver consistently and keep career trajectory stable.", delivery: "Quarterly career dashboards mapping responsibilities to impact metrics for reviews." },
      { focus: "Learning", want: "Keep growing without turning life upside down.", delivery: "Skill-sprint templates (8 weeks, 2 sessions/wk) fitted into existing rhythms." },
      { focus: "Side Projects", want: "Make progress on things that matter without burning out.", delivery: "Reserve flexible hours/week to turn backlog into prioritized next-actions." },
      { focus: "Relationships", want: "Keep the relationship alive — avoid the slow fade.", delivery: "Weekly 'sync' agenda suggesting meaningful touchpoints and surprise ideas." },
      { focus: "Family", want: "Stop juggling logistics and never miss the small stuff.", delivery: "Family hub consolidating chores, school, and health with 'who does what' suggestions." },
      { focus: "Social Life", want: "Sustain friendships that matter, not every invite.", delivery: "Priority roster surfacing high-impact friend gestures aligned with your calendar." },
      { focus: "Rest & Joy", want: "Get real downtime that recharges you.", delivery: "Enforced weekly hard stop + recommendations based on your Energy Ledger." },
    ]
  },
  {
    age: "44",
    title: "The Legacy Builder",
    promise: "Turn years of effort into clear influence.",
    provocation: "Why wait to make the next decades undeniable?",
    useCases: [
      { focus: "Body & Energy", want: "Sustain health with predictability, not extremes.", delivery: "Long-term health baseline (sleep, HRV) with modest, sustainable intervention prompts." },
      { focus: "Focus & Mind", want: "Do deep, generative work that matters for years.", delivery: "Reserved generative blocks + feedback loops with mentees/peers for predictability." },
      { focus: "Career & Work", want: "Leverage experience into impact and mentorship.", delivery: "Packaged accomplishments into coachable artifacts + mentorship cadence mapping." },
      { focus: "Learning", want: "Continue to grow in a way that enriches life, not just resume.", delivery: "Curated learning flows (book + project + conversation) scheduled across months." },
      { focus: "Side Projects", want: "Shape something that outlasts you.", delivery: "Project scaffolds converting ideas into organizational plans with handoff modes." },
      { focus: "Relationships", want: "Sustain intimacy and depth in long partnerships.", delivery: "Relationship retrospectives and rituals (retreats, starters) to keep depth alive." },
      { focus: "Family", want: "Manage obligations and secure family wellbeing.", delivery: "Estate, health, and education planning lanes with handover templates." },
      { focus: "Social Life", want: "Keep a few deep ties, not a loud calendar.", delivery: "Curated 'inner circle' planner for high-value shared experiences." },
      { focus: "Rest & Joy", want: "Pursue passions that make life richer, not busier.", delivery: "Project-in-residence: long-form creative blocks with exhibition milestones." },
    ]
  }
];

export default function HowToPage() {
  const [activeStage, setActiveStage] = useState(LIFE_STAGES[1]); // Default to 24

  return (
    <main className="min-h-screen bg-black text-white font-sans tracking-tight selection:bg-blue-500/30">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">

        {/* Apple-esque Header */}
        <header className="mb-24 space-y-8 max-w-4xl">
          <p className="text-[14px] font-bold uppercase tracking-[0.6em] text-blue-500">The Guide</p>
          <h1 className="text-6xl font-extrabold leading-[1.05] tracking-tighter bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent sm:text-7xl">
            Choose your era. <br />Own your direction.
          </h1>
          <p className="text-2xl text-slate-400 font-medium max-w-2xl leading-relaxed">
            Nu decides what you already want but can’t articulate. Pick your current horizon to see exactly how Nu delivers your organized life.
          </p>
        </header>

        {/* Dynamic Selector */}
        <section className="mb-32">
          <div className="flex flex-wrap gap-4 mb-16 border-b border-white/10 pb-8">
            {LIFE_STAGES.map((stage) => (
              <button
                key={stage.age}
                onClick={() => setActiveStage(stage)}
                className={`group relative px-8 py-4 rounded-full transition-all duration-300 ${activeStage.age === stage.age
                  ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/20'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
              >
                <span className="text-xl font-bold">Age {stage.age}</span>
                {activeStage.age === stage.age && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                )}
              </button>
            ))}
          </div>

          <div className="grid gap-16 lg:grid-cols-[1fr_2fr]">
            {/* The Stance Card */}
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-[12px] font-bold uppercase tracking-[0.4em] text-blue-500">{activeStage.title}</h2>
                <h3 className="text-5xl font-black tracking-tighter leading-none">{activeStage.promise}</h3>
                <p className="text-2xl text-slate-400 font-medium italic">"{activeStage.provocation}"</p>
              </div>

              <div className="rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-800 p-10 text-white shadow-2xl">
                <p className="text-lg font-bold mb-4 uppercase tracking-widest opacity-70">The System</p>
                <p className="text-2xl font-black leading-tight">
                  By organizing your days at {activeStage.age}, your life starts to compound. Nu handles the friction, you handle the results.
                </p>
              </div>
            </div>

            {/* Use Case Grid */}
            <div className="grid gap-6 sm:grid-cols-2">
              {activeStage.useCases.map((uc) => (
                <div key={uc.focus} className="group p-8 rounded-[2rem] border border-white/5 bg-white/[0.03] transition-all hover:bg-white/[0.06] hover:border-white/10">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4">{uc.focus}</h4>
                  <p className="text-lg font-bold text-white mb-2 leading-tight">"{uc.want}"</p>
                  <p className="text-slate-400 font-medium">{uc.delivery}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Why Wait Reel */}
        <section className="space-y-12">
          <div className="space-y-4 px-6 text-center lg:text-left">
            <h2 className="text-[14px] font-bold uppercase tracking-[0.5em] text-blue-500">The Expansion. Connected.</h2>
            <h3 className="text-6xl font-black tracking-tighter">Why wait?</h3>
          </div>
          <PromotionalReel />
        </section>

        {/* The Final Jobs-ian Footer */}
        <footer className="rounded-[4rem] bg-zinc-900/50 border border-white/5 p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
          <div className="space-y-10 relative z-10">
            <h3 className="text-5xl font-black tracking-tighter italic">"Nu organizes your days so your life can compound."</h3>
            <p className="text-2xl text-slate-400 max-w-2xl mx-auto font-medium">
              Join a legendary structure built for human reality. More predictable days. Visible progress. Fewer small disasters.
            </p>
            <div className="flex justify-center flex-col sm:flex-row gap-6">
              <Link href="/">
                <button className="w-full px-12 py-5 rounded-full bg-white text-black text-xl font-black tracking-tight transition-transform hover:scale-105 shadow-xl">
                  Start Now
                </button>
              </Link>
              <Link href="/">
                <button className="w-full px-12 py-5 rounded-full bg-blue-600/10 text-blue-400 text-xl font-black tracking-tight border border-blue-500/20 transition-all hover:bg-blue-600/20">
                  Why wait?
                </button>
              </Link>
            </div>
          </div>
        </footer >
      </div >
    </main >
  );
}
