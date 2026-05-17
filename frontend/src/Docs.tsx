import { useState } from 'react';
import { AnimatedContent } from './ReactBits/ReactBits';
import { CloseButton } from './Reusables';

type Section = {
  id: string;
  label: string;
};

const SECTIONS: Section[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'concepts', label: 'Core Concepts' },
  { id: 'quickstart', label: 'Quick Start' },
  { id: 'patches', label: 'Example Patches' },
  { id: 'modules', label: 'Module Reference' },
  { id: 'tips', label: 'Practical Tips' },
];

const MODULE_DOCS = [
  {
    name: 'Oscillator',
    desc: 'Produces basic periodic sounds at a given pitch.',
    details: [
      { label: 'Sine', text: 'Pure tone — smooth.' },
      { label: 'Square', text: 'Hollow/woody — strong odd harmonics.' },
      { label: 'Triangle', text: 'Softer than square.' },
      { label: 'Sawtooth', text: 'Bright and buzzy — rich harmonics.' },
    ],
  },
  {
    name: 'Envelope (ADSR)',
    desc: 'Shapes the loudness of a note over time.',
    details: [
      { label: 'Attack', text: 'How fast the sound reaches full level when triggered.' },
      { label: 'Decay', text: 'Time until the sound settles to the sustain level.' },
      { label: 'Sustain', text: 'Level held while the note is held.' },
      { label: 'Release', text: 'How long it fades after the note is released.' },
    ],
  },
  {
    name: 'Filter',
    desc: 'Removes or emphasizes frequency ranges.',
    details: [
      { label: 'Low-pass', text: 'Keeps lows, reduces highs — darker sound.' },
      { label: 'High-pass', text: 'Keeps highs, reduces lows — removes rumble.' },
      { label: 'Band-pass', text: 'Keeps a narrow frequency band — telephone-like.' },
      { label: 'Notch', text: 'Removes a narrow band — useful for hum removal.' },
    ],
  },
  {
    name: 'Distortion',
    desc: 'Alters waveform shape to add grit or character.',
    details: [
      { label: 'Sinoid fold', text: 'Smooth foldback distortion.' },
      { label: 'Soft clip', text: 'Rounded peaks.' },
      { label: 'Hard clip', text: 'Sharp cutoff.' },
      { label: 'Bitcrush', text: 'Digital lo-fi character.' },
    ],
  },
  {
    name: 'LFO',
    desc: 'Like an oscillator but slow; used to modulate other parameters.',
    details: [
      { label: 'Vibrato', text: 'Connect LFO → Oscillator.frequency for pitch wobble.' },
      { label: 'Tremolo', text: 'Connect LFO → Gain for volume wobble.' },
      { label: 'Filter sweep', text: 'Connect LFO → Filter.frequency for tonal movement.' },
    ],
  },
  {
    name: 'Modulator',
    desc: 'Combines two signals to create new timbres.',
    details: [
      { label: 'AM', text: 'Amplitude modulation — tremolo effect, adds sidebands.' },
      { label: 'FM', text: 'Frequency modulation — bell and metallic sounds.' },
      { label: 'PM', text: 'Phase modulation — similar to FM.' },
      { label: 'RM', text: 'Ring modulation — multiplies signals for inharmonic textures.' },
    ],
  },
  {
    name: 'Gain',
    desc: 'Controls loudness (volume).',
    details: [],
  },
  {
    name: 'Sequencer',
    desc: 'Emits trigger events in a programmed step pattern.',
    details: [
      { label: 'Usage', text: 'Connect Sequencer.trigger → Envelope.trigger to automate rhythms.' },
    ],
  },
  {
    name: 'Keyboard',
    desc: 'Sends pitch (freq) and trigger events when keys are pressed.',
    details: [
      { label: 'freq', text: 'Connect to Oscillator.frequency to control pitch.' },
      { label: 'trigger', text: 'Connect to Envelope.trigger for note on/off.' },
    ],
  },
  {
    name: 'Utilities',
    desc: 'Output, Mixer, and Splitter.',
    details: [
      { label: 'Output', text: 'Final audio destination (speakers). Adjust master level here.' },
      { label: 'Mixer', text: 'Combine multiple inputs into one output.' },
      { label: 'Splitter', text: 'Send one input to multiple outputs.' },
    ],
  },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <code className="block bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-xs text-indigo-200 font-mono whitespace-pre leading-relaxed">
      {children}
    </code>
  );
}

function SectionAnchor({ id }: { id: string }) {
  return <span id={id} className="block" style={{ scrollMarginTop: 24 }} />;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-indigo-100 mb-4 mt-8 first:mt-0 tracking-wide">
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-indigo-200/80 uppercase tracking-widest mb-2 mt-6">
      {children}
    </h3>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 mr-1">
      {children}
    </span>
  );
}

function ModuleCard({ mod }: { mod: typeof MODULE_DOCS[0] }) {
  return (
    <div className="glass-card p-4 mb-3">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-semibold text-indigo-100 text-sm">{mod.name}</span>
      </div>
      <p className="text-indigo-300/70 text-xs mb-2">{mod.desc}</p>
      {mod.details.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {mod.details.map(d => (
            <>
              <dt key={`dt-${d.label}`} className="text-[11px] font-mono text-indigo-400 pt-0.5 whitespace-nowrap">{d.label}</dt>
              <dd key={`dd-${d.label}`} className="text-[11px] text-indigo-300/60 leading-relaxed">{d.text}</dd>
            </>
          ))}
        </dl>
      )}
    </div>
  );
}

function DocsContent() {
  return (
    <div className="text-sm text-indigo-200/80 leading-relaxed space-y-1">

      {/* Overview */}
      <SectionAnchor id="overview" />
      <SectionHeading>Overview</SectionHeading>
      <p className="text-indigo-300/70 mb-4">
        A browser-based modular synthesizer. Create sounds by connecting small functional blocks — <em>modules</em> — with virtual cables. No audio experience required.
      </p>
      <div className="glass-card p-4 mb-4">
        <p className="text-xs text-indigo-300/60">
          Modules produce or transform either <span className="text-indigo-200">audio signals</span> (what you hear) or <span className="text-indigo-200">control signals</span> (events and slow-changing values that drive other modules). Connect outputs to inputs; signal chains end at <Pill>Output</Pill>.
        </p>
      </div>

      {/* Core Concepts */}
      <SectionAnchor id="concepts" />
      <SectionHeading>Core Concepts</SectionHeading>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div className="glass-card p-4">
          <p className="text-xs font-semibold text-indigo-200 mb-1">Audio Signals</p>
          <p className="text-xs text-indigo-300/60">Continuous, fast-changing waveforms that represent sound. Produced by oscillators, shaped by filters and envelopes, and ultimately sent to the Output module.</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-semibold text-indigo-200 mb-1">Control / Trigger Signals</p>
          <p className="text-xs text-indigo-300/60">Either event-like (note on/off from Keyboard or Sequencer) or slow-changing values (LFO sweeping a filter frequency). They drive parameters of other modules.</p>
        </div>
        <div className="glass-card p-4 sm:col-span-2">
          <p className="text-xs font-semibold text-indigo-200 mb-1">Signal Flow</p>
          <p className="text-xs text-indigo-300/60">Place modules on the canvas and connect them. Every chain ends at <Pill>Output</Pill> — without it, you hear nothing. Audio flows from source → processing → output; control flows from controller → parameter.</p>
        </div>
      </div>

      {/* Quick Start */}
      <SectionAnchor id="quickstart" />
      <SectionHeading>Quick Start</SectionHeading>
      <p className="text-indigo-300/70 text-xs mb-3">Add these modules from the Dock and connect them in order:</p>
      <div className="mb-3">
        <CodeBlock>{`1. Add: Oscillator → Filter → Gain → Output
2. Connect: Oscillator.output → Filter.input
            Filter.output  → Gain.input
            Gain.output    → Output.input
3. To play notes:
   Add Keyboard + Envelope
   Keyboard.freq    → Oscillator.frequency
   Keyboard.trigger → Envelope.trigger
   Envelope.output  → Gain.input`}</CodeBlock>
      </div>
      <p className="text-xs text-indigo-300/50">You should now hear a tone when pressing keyboard keys. Adjust the Filter and Gain knobs to shape the sound.</p>

      {/* Example Patches */}
      <SectionAnchor id="patches" />
      <SectionHeading>Example Patches</SectionHeading>

      <SubHeading>Simple Plucked Note</SubHeading>
      <p className="text-xs text-indigo-300/60 mb-2">Modules: Oscillator · Envelope · Gain · Output · Keyboard</p>
      <CodeBlock>{`Oscillator.output → Envelope.input → Gain.input → Output.input
Keyboard.trigger  → Envelope.trigger
Keyboard.freq     → Oscillator.frequency`}</CodeBlock>

      <SubHeading>Vibrato</SubHeading>
      <p className="text-xs text-indigo-300/60 mb-2">Modules: Oscillator · LFO · Gain · Output</p>
      <CodeBlock>{`Oscillator.output → Gain.input → Output.input
LFO.output        → Oscillator.frequency`}</CodeBlock>

      <SubHeading>Sequenced Rhythm</SubHeading>
      <p className="text-xs text-indigo-300/60 mb-2">Modules: Oscillator · Envelope · Gain · Sequencer · Output</p>
      <CodeBlock>{`Oscillator.output  → Envelope.input → Gain.input → Output.input
Sequencer.trigger  → Envelope.trigger`}</CodeBlock>

      {/* Module Reference */}
      <SectionAnchor id="modules" />
      <SectionHeading>Module Reference</SectionHeading>
      <p className="text-xs text-indigo-300/50 mb-4">All modules available in the Dock. Click a module on the canvas to edit its parameters.</p>
      <div>
        {MODULE_DOCS.map(mod => (
          <ModuleCard key={mod.name} mod={mod} />
        ))}
      </div>

      {/* Practical Tips */}
      <SectionAnchor id="tips" />
      <SectionHeading>Practical Tips</SectionHeading>
      <div className="glass-card p-4 mb-3">
        <p className="text-xs font-semibold text-indigo-200 mb-2">Typical signal chain</p>
        <CodeBlock>{`Oscillator → Filter → Distortion → Envelope → Gain → Output`}</CodeBlock>
      </div>
      <ul className="space-y-2 text-xs text-indigo-300/60 list-none">
        <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span><span>Use <strong className="text-indigo-200">Envelope</strong> to sculpt how notes start and stop — without it, notes play forever at full volume.</span></li>
        <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span><span>Use <strong className="text-indigo-200">LFO</strong> and <strong className="text-indigo-200">Modulator</strong> to add motion and complexity over time.</span></li>
        <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span><span>Keep volumes low while testing — feedback loops between modules can produce loud bursts.</span></li>
        <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span><span>Use <strong className="text-indigo-200">Mixer</strong> to layer multiple oscillators into one signal before the filter stage.</span></li>
        <li className="flex gap-2"><span className="text-indigo-400 shrink-0">→</span><span>Use <strong className="text-indigo-200">Splitter</strong> to send one source (e.g. Oscillator) into two separate processing chains simultaneously.</span></li>
      </ul>

    </div>
  );
}

function Docs(props: { close: () => void }) {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="font-lexend overlay-panel rounded-2xl z-50 w-full max-w-[72rem] mx-3 sm:mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-indigo-400/60 font-semibold mb-0.5">Reference</p>
          <h2 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-wide">
            Documentation
          </h2>
        </div>
        <CloseButton onClick={props.close} />
      </div>

      <div className="divider-glow mx-4 mt-4" />

      {/* Body: sidebar + content */}
      <div className="flex min-h-0" style={{ maxHeight: 'calc(85vh - 100px)' }}>

        {/* Sidebar */}
        <nav className="hidden sm:flex flex-col gap-0.5 px-3 py-4 shrink-0 w-44 border-r border-white/5 overflow-y-auto">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className={`text-left text-xs px-3 py-2 rounded-lg transition-all font-medium cursor-pointer ${
                activeSection === s.id
                  ? 'bg-indigo-500/20 text-indigo-200'
                  : 'text-indigo-400/50 hover:text-indigo-300 hover:bg-white/5'
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto px-5 py-5 min-w-0"
          onScroll={e => {
            const container = e.currentTarget;
            for (const s of SECTIONS) {
              const el = document.getElementById(s.id);
              if (!el) continue;
              const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top;
              if (top <= 40) setActiveSection(s.id);
            }
          }}
        >
          <DocsContent />
        </div>
      </div>
    </div>
  );
}

export default function DocsContainer(props: { func: (v: boolean) => void }) {
  const [visible, setVisible] = useState(true);
  return (
    <AnimatedContent
      className="items-center mx-auto z-10"
      distance={0}
      direction="vertical"
      reverse={false}
      duration={1}
      ease="power3.out"
      initialOpacity={1}
      animateOpacity
      scale={1}
      visible={visible}
      threshold={0.1}
      delay={0.1}
      disappearDuration={0.25}
      onDisappearanceComplete={() => props.func(false)}
    >
      <AnimatedContent
        distance={50}
        direction="vertical"
        reverse={false}
        duration={1}
        ease="power3.out"
        initialOpacity={1}
        animateOpacity
        scale={1}
        visible={true}
        threshold={0.1}
        delay={0.1}
      >
        <Docs close={() => setVisible(false)} />
      </AnimatedContent>
    </AnimatedContent>
  );
}
