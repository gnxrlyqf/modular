import { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { AnimatedContent } from './ReactBits/ReactBits';

const arrow = "M5.70711 9.71069C5.31658 10.1012 5.31658 10.7344 5.70711 11.1249L10.5993 16.0123C11.3805 16.7927 12.6463 16.7924 13.4271 16.0117L18.3174 11.1213C18.708 10.7308 18.708 10.0976 18.3174 9.70708C17.9269 9.31655 17.2937 9.31655 16.9032 9.70708L12.7176 13.8927C12.3271 14.2833 11.6939 14.2832 11.3034 13.8927L7.12132 9.71069C6.7308 9.32016 6.09763 9.32016 5.70711 9.71069Z"

function Pager(props: {curr?: number; total?: number}) {
  return (
    <div className="bg-indigo-300 rounded-xl flex items-center">
      <button className="mx-2 hover:-translate-x-1 ease-in-out duration-100 cursor-pointer">
        <svg className="rotate-90 transition-transform duration-200 "
        width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} fill="currentColor"
        >
          <path d={arrow} />
        </svg>
      </button>
      <span>{`${props.curr}/${props.total}`}</span>
      <button className="mx-2 hover:translate-x-1 ease-in-out duration-100 cursor-pointer">
        <svg className="rotate-270 transition-transform duration-200 "
        width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} fill="currentColor"
        >
          <path d={arrow} />
        </svg>
      </button>
    </div>
  )
}

function FilterButton(props: {text?: string}) {
  const [rot, setRot] = useState(0);
  const rotation = ["rotate-0", "rotate-180"]

  const f = () => {
    setRot(rot ? 0 : 1);
  }

  return (
    <button className="items-center flex flex-row bg-white/30 hover:bg-white/50 hover:-translate-y-0.5 text-gray-900 rounded-md pl-2 pr-1 ease-in-out duration-100 cursor-pointer"
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

function Filters() {
  return (
    <div className="font-lexend flex flex-row gap-3 mx-3">
      <div className="flex flex-row gap-2">
        <FilterButton text="Date" />
        <FilterButton text="Name" />
      </div>
    </div>
  )
}

function Search() {
  return (
    <div className="relative ml-auto font-lexend mr-3 text-gray-900">
      <input
        placeholder="Search..."
        className="input shadow-lg bg-white/30 px-3 py-1 rounded-md w-32 transition-all hover:w-56 focus:w-56 hover:bg-white/50 focus:bg-white/50 outline-none"
        name="search"
        type="search"
      />
      <svg
        className="size-6 absolute top-1 right-2 "
        stroke="currentColor"
        stroke-width="2"
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

function Card(props: {title?: string; datetime?: string}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleRightClick = (event: MouseEvent) => {
      event.preventDefault();
      
      // Remove any existing menu
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
    <div ref={cardRef} className="text-indigo-100 hover:text-indigo-700 bg-white/30 w-full rounded-md font-lexend hover:-translate-y-1 hover:bg-white/50 ease-in-out duration-100 cursor-pointer hover:shadow-xl">
      <img className="p-2 rounded-xl" src="src/assets/placeholder.jpg" />
      <div className="flex flex-row pb-1">
        <span className="ml-2 ">{props.title}</span>
        <span className="mr-2 ml-auto">{props.datetime}</span>
      </div>
    </div>
  )
}

function Projects(props: {personal?: boolean; func?: (value: boolean) => void}) {
  const count = 4;
  const curr = 1;
  const total = 1;

  return (
    <div className="font-lexend backdrop-blur bg-indigo-400/50 rounded-2xl z-50 max-w-200 mx-auto">
      <button onClick={() => props.func && props.func(false)} className="m-3">
        <img src="src/assets/close.svg" alt="close" className="w-7 ease-in-out duration-100 hover:scale-110 cursor-pointer"/>
      </button>
      <p className="text-center text-4xl pb-5 text-indigo-100">
        {props.personal ? "Your projects" : "Community projects"}
      </p>
      <div className="flex flex-row my-2">
        <Filters />
        <Search />
      </div>
      <div className="mx-3">
        <div className="grid grid-cols-3 gap-3">
          <Card title="Title 1" datetime="Time 1"/>
          <Card title="Title 2" datetime="Time 2"/>
          <Card title="Title 3" datetime="Time 3"/>
          <Card title="Title 4" datetime="Time 4"/>
        </div>
        <div className="flex flex-row py-3 text-zinc-900">
          <p>{`${count} results found`}</p>
          <p className="ml-auto mx-2">Page</p>
          <Pager curr={curr} total={total}/>
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