import { signInWithGoogle } from "../actions";
import { GoogleIcon } from "./google-icon";

type GoogleAuthButtonProps = {
  next?: string;
};

export function GoogleAuthButton({ next }: GoogleAuthButtonProps) {
  return (
    <form action={signInWithGoogle}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#405473] bg-transparent px-5 text-sm font-bold text-white transition-colors hover:border-brand-cyan hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </form>
  );
}
