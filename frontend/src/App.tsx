import { useState } from "react";

import {SplitText, AnimatedContent, SpotlightCard} from './ReactBits/ReactBits'
import {Anchor, Button} from "./Reusables";
import LoginOverlay from "./Login";
import {ProjectsContainer} from "./Projects";
import ProfileContainer from "./Profile";
import SettingsContainer from "./Settings";

const ACCESS_COOKIE_NAME = "accessToken";

function hasCookie(cookieName: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .some((entry) => entry.startsWith(`${cookieName}=`));
}

function WelcomeText() {
  const handleAnimationComplete = () => {
    console.log('All letters have animated!');
  };

  return (
    <div className="text-center flex flex-col gap-10 justify-center inset-0 min-h-screen absolute">
      <SplitText
        text="Your modular synthesizer,"
        className="font-lexend text-indigo-400 text-7xl font-semibold text-center"
        delay={50}
        duration={.25}
        ease="power3.out"
        splitType="chars"
        from={{ opacity: 0, y: 40 }}
        to={{ opacity: 1, y: 0 }}
        threshold={0.1}
        rootMargin="-100px"
        textAlign="center"
        onLetterAnimationComplete={handleAnimationComplete}
      />
      <SplitText
        text="Built in web."
        className="font-lexend text-indigo-400 text-7xl font-semibold text-center"
        delay={50}
        duration={1}
        ease="power3.out"
        splitType="chars"
        from={{ opacity: 0, y: 40 }}
        to={{ opacity: 1, y: 0 }}
        threshold={0.1}
        rootMargin="-100px"
        textAlign="center"
        onLetterAnimationComplete={handleAnimationComplete}
      />

    </div>
  )
}

function TopBar(props : {func?: (value: boolean) => void; isLoggedIn?: boolean; onProfileOpen?: (value: boolean) => void; onProjectsOpen?: (value: boolean) => void}) {
  const user = "M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"

  return (
    <AnimatedContent
      className="items-center mx-auto z-10"
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
      delay={0.1}
    >
      <div className="backdrop-blur bg-indigo-400/50 rounded-2xl px-3 py-3 my-5 mx-auto max-w-200 flex">
        <span className="font-lexend text-indigo-100 text-2xl px-2">
          lhrba
        </span>
        { props.isLoggedIn ? <div className="ml-auto flex flex-row gap-3 font-lexend">
          <Button text="Community" func={props.onProjectsOpen} />
          <Button text={
            <svg width="16" height="24" viewBox="2 2 20 20" fill="none">
              <path d={user} stroke="currentColor" strokeWidth={2}/>
            </svg>
          } func={props.onProfileOpen} />
        </div> : <div className="ml-auto flex flex-row gap-3 font-lexend">
          <Anchor text="Try it!"/>
          <Button text="Log in" func={props.func} />
        </div> }
      </div>
    </AnimatedContent>
  )
}

function Description() {
  return (
    <AnimatedContent
      distance={50}
      direction="vertical"
      reverse={false}
      duration={1}
      ease="power3.out"
      initialOpacity={0}
      animateOpacity
      scale={1}
      threshold={0.1}
      delay={0.1}
    >
      <div className="font-lexend text-3xl items-center text-center max-w-200 mx-auto text-indigo-400 inset-0 absolute">
        Learn how sound works, how we use it to make music, and practice your knowledge using our simple web-based modular synth.
      </div>
    </AnimatedContent>
  )
}

function List() {
  const learn = "M5,12h9V0H9v6L7,4L5,6V0H4C2.9,0,2,0.9,2,2v12c0,1.1,0.9,2,2,2h10v-2H5c-0.6,0-1-0.4-1-1S4.4,12,5,12z"
  const create = "M883.626667 300.373333C900.266667 283.733333 900.266667 256 883.626667 240.213333L783.786667 140.373333C768 123.733333 740.266667 123.733333 723.626667 140.373333L645.12 218.453333 805.12 378.453333M128 736 128 896 288 896 759.893333 423.68 599.893333 263.68 128 736Z";
  const share = "M46.5,256v186.2c0,38.6,31.2,69.8,69.8,69.8h279.3c38.6,0,69.8-31.2,69.8-69.8l0-186.2c0-12.9-10.4-23.3-23.3-23.3 c-12.9,0-23.3,10.4-23.3,23.3v186.2c0,12.8-10.4,23.2-23.3,23.3H116.4c-12.8,0-23.2-10.4-23.3-23.3l0-186.2 c0-12.9-10.4-23.3-23.3-23.3S46.5,243.1,46.5,256z M365.5,99.9L272.5,6.8c-9.1-9.1-23.8-9.1-32.9,0l-93.1,93.1c-9.1,9.1-9.1,23.8,0,32.9c9.1,9.1,23.8,9.1,32.9,0L256,56.2 l76.6,76.6c9.1,9.1,23.8,9.1,32.9,0S374.6,109,365.5,99.9L365.5,99.9z M232.7,23.3v302.5c0,12.9,10.4,23.3,23.3,23.3s23.3-10.4,23.3-23.3V23.3C279.3,10.4,268.9,0,256,0S232.7,10.4,232.7,23.3";

  return (
    <div className="flex flex-row gap-20 bottom-1/4 absolute self-center cursor-default">
    <SpotlightCard spotlightColor="rgba(129, 140, 248, 0.3)">
      <div className="flex flex-row gap-5 font-lexend text-4xl items-center text-indigo-300">
        <svg className="w-10 h-10" fill="currentColor" stroke="currentColor" strokeWidth=".1" viewBox="0 0 16 16">
          <path d={learn} />
        </svg>
        <span>Learn</span>
      </div>
      <p className="font-lexend text-2xl mt-3 text-indigo-300">
        Learn using the resources on our platform. Explore guides and tutorials made for all levels, and build your knowledge step by step.
      </p>
    </SpotlightCard>
    <SpotlightCard spotlightColor="rgba(129, 140, 248, 0.3)">
      <div className="flex flex-row gap-5 font-lexend text-4xl items-center text-indigo-300">
        <svg className="w-10 h-10" fill="currentColor" stroke="currentColor" strokeWidth="1" viewBox="0 0 1024 1024">
          <path d={create} />
        </svg>
        <span>Create</span>
      </div>
      <p className="font-lexend text-2xl mt-3 text-indigo-300">
        Practice what you learn by using our modular synth. Experiment with sounds and build your own music right in your browser.
      </p>
    </SpotlightCard>
    <SpotlightCard spotlightColor="rgba(129, 140, 248, 0.3)">
      <div className="flex flex-row gap-5 font-lexend text-4xl items-center text-indigo-300">
        <svg className="w-10 h-10" fill="currentColor" stroke="currentColor" strokeWidth="1" viewBox="0 0 512 512">
          <path d={share} />
        </svg>
        <span>Share</span>
      </div>
      <p className="font-lexend text-2xl mt-3 text-indigo-300">
        Share your creations with others and explore what the community has made. Get inspired, connect, and discover.
      </p>
    </SpotlightCard>
  </div>
  )
}

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasCookie(ACCESS_COOKIE_NAME));

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  return (
    <div>
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute items-center w-full z-20">
          <TopBar func={setShowLogin} isLoggedIn={isLoggedIn} onProfileOpen={setShowProfile} onProjectsOpen={setShowProjects} />
          {showProjects && <ProjectsContainer func={setShowProjects} />}
          {showProfile && <ProfileContainer func={setShowProfile} set={setShowSettings} />}
          {showSettings && <SettingsContainer func={setShowSettings} setLoggedIn={setIsLoggedIn} />}
          {showLogin && <LoginOverlay func={setShowLogin} onSuccess={handleLoginSuccess} />}
        </div>
        <div className="scale-110 absolute inset-0 bg-[url(assets/background.jpg)] bg-center bg-cover blur-sm z-0" />
        <div className="absolute inset-0 z-10 pointer-events-none bg-linear-to-b from-transparent via-transparent to-indigo-950" />
        {/* <WelcomeText /> */}
      </div>
      {/* <div className="relative">
        <div className="bg-indigo-950 to-indigo-900 bg-linear-to-b min-h-screen w-full h-250">
        </div>
        <div className="absolute inset-0 z-10 mt-40 flex flex-col">
          <Description />
          <List />
        </div>
      </div> */}
    </div>
  );
}

export default App
