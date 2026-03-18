import { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { AnimatedContent } from './ReactBits/ReactBits';

const arrow = "M5.70711 9.71069C5.31658 10.1012 5.31658 10.7344 5.70711 11.1249L10.5993 16.0123C11.3805 16.7927 12.6463 16.7924 13.4271 16.0117L18.3174 11.1213C18.708 10.7308 18.708 10.0976 18.3174 9.70708C17.9269 9.31655 17.2937 9.31655 16.9032 9.70708L12.7176 13.8927C12.3271 14.2833 11.6939 14.2832 11.3034 13.8927L7.12132 9.71069C6.7308 9.32016 6.09763 9.32016 5.70711 9.71069Z"

type ApiProject = {
  time?: string;
  image?: string;
  title?: string;
  thumbnailUrl?: string;
  url?: string;
  id?: number;
};

const API_URL = "https://c7e73032-d72e-445c-bcf6-58f694a5f2ac.mock.pstmn.io/api/projects";
const PAGE_SIZE = 9;
const FALLBACK_IMAGE = "https://via.placeholder.com/1920x1080?text=Project";

function Pager(props: {
  curr: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="bg-indigo-300 rounded-xl flex items-center">
      <button
        onClick={props.onPrev}
        disabled={props.curr <= 1}
        className="mx-2 hover:-translate-x-1 ease-in-out duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="rotate-90 transition-transform duration-200 "
        width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} fill="currentColor"
        >
          <path d={arrow} />
        </svg>
      </button>
      <span>{`${props.curr}/${props.total}`}</span>
      <button
        onClick={props.onNext}
        disabled={props.curr >= props.total}
        className="mx-2 hover:translate-x-1 ease-in-out duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="rotate-270 transition-transform duration-200 "
        width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} fill="currentColor"
        >
          <path d={arrow} />
        </svg>
      </button>
    </div>
  )
}

function FilterButton(props: {text?: string; onClick?: () => void}) {
  const [rot, setRot] = useState(0);
  const rotation = ["rotate-0", "rotate-180"]

  const f = () => {
    setRot((prev) => (prev ? 0 : 1));
    props.onClick?.();
  }

  return (
    <button type="button" className="items-center flex flex-row bg-white/30 hover:bg-white/50 hover:-translate-y-0.5 text-gray-900 rounded-md pl-2 pr-1 ease-in-out duration-100 cursor-pointer"
    onClick={f}
    >
      <span>{props.text}</span>
      <svg className={`${rotation[rot]} transition-transform duration-200`}
      width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} fill="currentColor"
      >
        <path d={arrow} />
      </svg>
    </button>
  )
}

function NewButton() {
  return (
    <button type="button" className="mr-3 items-center flex flex-row bg-white/30 hover:bg-white/50 hover:-translate-y-0.5 text-gray-900 rounded-md px-1 ease-in-out duration-100 cursor-pointer"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M6 12H18M12 6V18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  )
}

function Filters(props: {onDateSort: () => void; onNameSort: () => void}) {
  return (
    <div className="font-lexend flex flex-row gap-3 mx-3">
      <div className="flex flex-row gap-2">
        <FilterButton text="Date" onClick={props.onDateSort} />
        <FilterButton text="Name" onClick={props.onNameSort} />
      </div>
    </div>
  )
}

function Search(props: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative ml-auto font-lexend mr-3 text-gray-900">
      <input
        placeholder="Search..."
        className="input shadow-lg bg-white/30 px-3 py-1 rounded-md w-32 transition-all hover:w-56 focus:w-56 hover:bg-white/50 focus:bg-white/50 outline-none"
        name="search"
        type="search"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
      <svg
        className="size-6 absolute top-1 right-2 "
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    </div>
  )
}

function MenuEntry(props: {children?: React.ReactNode; func?: () => void}) {
  return (
    <li className="cursor-pointer text-indigo-700">
      <button className="hover:bg-indigo-300 cursor-pointer px-3 py-1 w-full text-left">
        {props.children}
      </button>
    </li>
  )
}

function ContextMenu() {
  return (
    <ul className="bg-indigo-100 rounded-md shadow-lg py-1 font-lexend">
      <MenuEntry>Delete</MenuEntry>
      <MenuEntry>Rename</MenuEntry>
      <MenuEntry>Copy link</MenuEntry>
    </ul>
  );
}

function Card(props: {card: ApiProject; index: number}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const cardTitle = props.card.title ?? `Untitled project ${props.index + 1}`;
  const cardTime = props.card.time ?? `#${props.card.id ?? props.index + 1}`;
  const cardImage = props.card.image ?? props.card.url ?? props.card.thumbnailUrl ?? FALLBACK_IMAGE;

  useEffect(() => {
    const handleRightClick = (event: MouseEvent) => {
      event.preventDefault();
      
      const existingMenu = document.querySelector('[data-custom-menu]');
      if (existingMenu) {
        existingMenu.remove();
      }
      
      const menu = document.createElement('div');
      menu.setAttribute('data-custom-menu', 'true');
      menu.className = "fixed z-50"
      menu.style.left = event.pageX + 'px';
      menu.style.top = event.pageY + 'px';
      document.body.appendChild(menu);

      const root = createRoot(menu);
      root.render(<ContextMenu />);

      const removeMenu = () => {
        root.unmount();
        menu.remove();
      };
      document.addEventListener('click', removeMenu, { once: true });
    }

    const cardElement = cardRef.current;
    cardElement?.addEventListener("contextmenu", handleRightClick);

    return () => {
      cardElement?.removeEventListener('contextmenu', handleRightClick);
    };
  }, [])

  return (
    <a href="#" ref={cardRef} className="block text-indigo-100 hover:text-indigo-700 bg-white/30 w-full rounded-md font-lexend hover:-translate-y-1 hover:bg-white/50 ease-in-out duration-100 cursor-pointer hover:shadow-xl">
      <img className="p-2 rounded-xl h-40 w-full object-cover" src={cardImage} alt={cardTitle} />
      <div className="flex flex-row pb-1">
        <span className="ml-2 ">{cardTitle}</span>
        <span className="mr-2 ml-auto">{cardTime}</span>
      </div>
    </a>
  )
}

function Projects(props: {personal?: boolean; func?: (value: boolean) => void}) {
  const [cards, setCards] = useState<ApiProject[]>([]);
  const [curr, setCurr] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setDateAsc] = useState(true);
  const [, setNameAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const getTimeValue = (value?: string) => {
    if (!value) {
      return 0;
    }

    const parsedDate = Date.parse(value);
    if (!Number.isNaN(parsedDate)) {
      return parsedDate;
    }

    const parsedNumber = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(parsedNumber)) {
      return parsedNumber;
    }

    return 0;
  };

  const sortByDate = () => {
    setDateAsc((prevDateAsc) => {
      const nextDateAsc = !prevDateAsc;

      setCards((prevCards) => {
        const sorted = [...prevCards].sort((a, b) => getTimeValue(a.time) - getTimeValue(b.time));
        return nextDateAsc ? sorted : sorted.reverse();
      });

      return nextDateAsc;
    });

    setCurr(1);
  };

  const sortByName = () => {
    setNameAsc((prevNameAsc) => {
      const nextNameAsc = !prevNameAsc;

      setCards((prevCards) => {
        const sorted = [...prevCards].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
        return nextNameAsc ? sorted : sorted.reverse();
      });

      return nextNameAsc;
    });

    setCurr(1);
  };

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}?_limit=30`);

        if (!response.ok) {
          throw new Error("Could not fetch projects");
        }

        const data: ApiProject[] = await response.json();

        setCards(data);
        setCurr(1);
      } catch {
        setCards([]);
        setError("Failed to load projects.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCards = cards.filter((card, index) => {
    if (!normalizedQuery) {
      return true;
    }

    const title = (card.title ?? `Untitled project ${index + 1}`).toLowerCase();
    return title.includes(normalizedQuery);
  });

  const total = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
  const visibleCards = filteredCards.slice((curr - 1) * PAGE_SIZE, curr * PAGE_SIZE);

  const goPrev = () => setCurr((value) => Math.max(1, value - 1));
  const goNext = () => setCurr((value) => Math.min(total, value + 1));

  return (
    <div className="font-lexend backdrop-blur bg-indigo-400/50 rounded-2xl z-50 max-w-200 mx-auto">
      <button onClick={() => props.func && props.func(false)} className="m-3">
        <img src="src/assets/close.svg" alt="close" className="w-7 ease-in-out duration-100 hover:scale-110 cursor-pointer"/>
      </button>
      <p className="text-center text-4xl pb-5 text-indigo-100">
        {props.personal ? "Your projects" : "Community projects"}
      </p>
      <div className="flex flex-row my-2">
        <Filters onDateSort={sortByDate} onNameSort={sortByName} />
        <Search
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            setCurr(1);
          }}
        />
        <NewButton />
      </div>
      <div className="mx-3">
        <div className="grid grid-cols-3 gap-3">
          {loading && <p className="col-span-3 text-indigo-100 py-5">Loading projects...</p>}
          {!loading && error && <p className="col-span-3 text-red-100 py-5">{error}</p>}
          {!loading && !error && visibleCards.map((card, index) => (
            <Card key={`${card.id ?? card.title ?? "project"}-${index}`} card={card} index={(curr - 1) * PAGE_SIZE + index} />
          ))}
        </div>
        <div className="flex flex-row py-3 text-zinc-900">
          <p>{`${filteredCards.length} results found`}</p>
          <p className="ml-auto mx-2">Page</p>
          <Pager curr={curr} total={total} onPrev={goPrev} onNext={goNext} />
        </div>
      </div>
    </div>
  )
}

function ProjectsContainer(props: {func?: (value: boolean) => void}) {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatedContent
      className="items-center mx-auto z-10"
      distance={0}
      direction="vertical"
      reverse={false}
      duration={1}
      ease="power3.out"
      initialOpacity={0}
      animateOpacity
      scale={1}
      visible={visible}
      threshold={0.1}
      delay={0.1}
      disappearDuration={0.5}
      onDisappearanceComplete={() => props.func && props.func(false)}
    >
        <AnimatedContent
          distance={50}
          direction="vertical"
          reverse={false}
          duration={1}
          ease="power3.out"
          initialOpacity={0}
          animateOpacity
          scale={1}
          visible={true}
          threshold={0.1}
          delay={.1}
        >
          <Projects func={setVisible}/>
        </AnimatedContent>        
    </AnimatedContent>
  )
}

export default ProjectsContainer