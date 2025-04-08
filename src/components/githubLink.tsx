import { buildUrl } from "@/utils/buildUrl";

export const GitHubLink = () => {
  return (
    <div className="absolute right-0 z-10 m-24">
      <a
        draggable={false}
        href="https://izdrail.com"
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="p-8 rounded-16 bg-[#1F2328] hover:bg-[#33383E] active:bg-[565A60] flex">

          <div className="mx-4 text-white font-bold">
            <span className="text-white">Portfolio</span>
          </div>
        </div>
      </a>
    </div>
  );
};
