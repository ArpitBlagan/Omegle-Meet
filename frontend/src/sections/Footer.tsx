import { GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";
import logo from "@/img/icon.png";
import { Link } from "react-router-dom";
const Footer = () => {
  return (
    <div className="flex flex-wrap gap-3 items-center justify-start  mt-2 h-[100px]">
      <div>
        <h1>Made with ❤️ By Arpit Blagan 🇮🇳</h1>
      </div>
      <div>
        <a href="https://github.com/ArpitBlagan/webrtc-sfu" target="_blank">
          <GitHubLogoIcon width={50} height={30} />
        </a>
      </div>
      <div>
        <a
          href="https://www.linkedin.com/in/arpit-blagan-79081b193/"
          target="_blank"
        >
          <LinkedInLogoIcon width={50} height={30} />
        </a>
      </div>
      <div className="flex-1 flex justify-end items-center gap-4">
        <Link to="/" className="font-semibold text-xl">
          Duck
        </Link>
        <img src={logo} width={50} height={50} className="rounded-full" />
      </div>
    </div>
  );
};

export default Footer;
