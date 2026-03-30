import { useRef, useState } from "react";
import { AnimatedContent } from './ReactBits/ReactBits';
import { Projects } from "./Projects";

const PROFILE_ENDPOINT = "http://127.0.0.1/api/users/me/"

const placeholder = {
  picture: "https://picsum.photos/600/600",
  username: "gnxrly",
  display: "Gnarly QF",
  bio: "elimination is imminent"
}

function Profile(props: { func: (value: boolean) => void; set: (value: boolean) => void}) {
  const [error, setError] = useState("");

  // try {
  //   const response = await fetch(PROFILE_ENDPOINT, { method: "GET" });

  //   if (!response.ok) {
  //     throw new Error('Failed to retreive user data.');
  //   }
  // } catch (err) {
  //   const message = err instanceof Error ? err.message : 'Failed to retreive user data.';
  //   setError(message);
  // }

  return (
    <div className="font-lexend backdrop-blur bg-indigo-400/50 rounded-2xl z-50 max-w-200 mx-auto">
      <div className="flex items-center justify-between px-3 pt-3">
        <button onClick={() => { props.set(false); props.func(false); }}>
          <img src="src/assets/close.svg" alt="close" className="w-7 ease-in-out duration-100 hover:scale-110 cursor-pointer"/>
        </button>
        <button type="button" aria-label="Settings"
          onClick={() => {props.func(false); props.set(true)}}
        >
          <svg className="w-7 text-indigo-100 ease-in-out duration-100 hover:scale-110 cursor-pointer" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.6006 21.0761L19.0608 17.9236C19.6437 17.5871 19.9346 17.4188 20.1465 17.1834C20.3341 16.9751 20.4759 16.7297 20.5625 16.4632C20.6602 16.1626 20.6602 15.8267 20.6602 15.1568V8.84268C20.6602 8.17277 20.6602 7.83694 20.5625 7.53638C20.4759 7.26982 20.3341 7.02428 20.1465 6.816C19.9355 6.58161 19.6453 6.41405 19.0674 6.08043L13.5996 2.92359C13.0167 2.58706 12.7259 2.41913 12.416 2.35328C12.1419 2.295 11.8584 2.295 11.5843 2.35328C11.2744 2.41914 10.9826 2.58706 10.3997 2.92359L4.93843 6.07666C4.35623 6.41279 4.06535 6.58073 3.85352 6.816C3.66597 7.02428 3.52434 7.26982 3.43773 7.53638C3.33984 7.83765 3.33984 8.17436 3.33984 8.84742V15.1524C3.33984 15.8254 3.33984 16.1619 3.43773 16.4632C3.52434 16.7297 3.66597 16.9751 3.85352 17.1834C4.06548 17.4188 4.35657 17.5871 4.93945 17.9236L10.3997 21.0761C10.9826 21.4126 11.2744 21.5806 11.5843 21.6465C11.8584 21.7047 12.1419 21.7047 12.416 21.6465C12.7259 21.5806 13.0177 21.4126 13.6006 21.0761Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 11.9998C9 13.6566 10.3431 14.9998 12 14.9998C13.6569 14.9998 15 13.6566 15 11.9998C15 10.3429 13.6569 8.99976 12 8.99976C10.3431 8.99976 9 10.3429 9 11.9998Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="px-6 pb-6">
        <div className="flex items-center gap-4">
          <img
            src={placeholder.picture}
            alt={placeholder.display}
            className="w-24 h-24 rounded-full object-cover ring-2 ring-indigo-300"
          />
          <div className="min-w-0">
            <h2 className="text-3xl font-bold text-white leading-tight truncate">{placeholder.display}</h2>
            <p className="text-base text-indigo-100/90">@{placeholder.username}</p>
          </div>
        </div>
        <p className="mt-4 text-indigo-50">{placeholder.bio}</p>
      </div>
      {error && <p className="text-red-200 text-sm text-center">{error}</p>}
      <Projects user="kayn" />
    </div>
  )
}

function ProfileContainer(props: {func: (value: boolean) => void; set: (value: boolean) => void}) {
  const [visible, setVisible] = useState(true);
  const openSettingsOnCloseRef = useRef(false);

  const handleClose = () => {
    openSettingsOnCloseRef.current = false;
    setVisible(false);
  };

  const handleOpenSettings = () => {
    openSettingsOnCloseRef.current = true;
    setVisible(false);
  };

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
      disappearDuration={0.25}
      onDisappearanceComplete={() => {
        props.set(openSettingsOnCloseRef.current);
        props.func(false);
        openSettingsOnCloseRef.current = false;
      }}
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
          <Profile func={handleClose} set={handleOpenSettings}/>
        </AnimatedContent>        
    </AnimatedContent>
  )
}

export default ProfileContainer