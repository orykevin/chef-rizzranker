"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";
import { useConvex } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

type TopThreeData = {
  username: string;
  characterCount: number;
  messageCount: number;
  _id: Id<"globalLeaderboard">;
  _creationTime: number;
  userId: Id<"users">;
  totalScore: number;
}

export function SignInForm() {
  const convex = useConvex();
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [topThree, setTopThree] = useState<TopThreeData[]>([]);

  useEffect(() => {
    const fetchTopThree = async () => {
      const data = (await convex.query(api.leaderboard.getTopThreeGlobalLeaderboard)).filter((user) => user !== null);
    
      setTopThree(data);
    };
    fetchTopThree();
  }, [convex]);

  return (
    <div className="w-full max-w-[400px] md:max-w-[600px] mx-auto mt-3 px-3">
      <h1 className="text-2xl font-bold mb-2 text-center">Welcome to Rizz Ranker</h1>
      <p className="text-center text-slate-600 mb-2 max-w-1/2 mx-auto">Out-rizz your rivals, charm your way through the ranks</p>
      <div className="flex flex-col gap-2 mb-3">
        {topThree.map((user, index) => (
          <div
          key={user._id}
          className={"flex items-center gap-4 justify-between p-1 px-3 rounded-lg shadow bg-white"}
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-slate-600">#{index + 1}</div>
              <div className="font-semibold">{user.username}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-500">{user.characterCount > 1 ? `${user.characterCount} characters` : `${user.characterCount} character`}</div>
              -
              <div className="text-sm text-slate-500">{user.messageCount > 1 ? `${user.messageCount} messages` : `${user.messageCount} message`}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-xl">{user.totalScore.toFixed(1)}</div>
            <div className="text-sm text-slate-500">Score</div>
          </div>
        </div>
        ))}
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((_error) => {
            let toastTitle: string;
            toastTitle =
              flow === "signIn"
                ? "Could not sign in, did you mean to sign up?"
                : "Could not sign up, did you mean to sign in?";
            setErrorMessage(toastTitle);
            setSubmitting(false); 
          });
        }}
      >
        <h2 className="text-lg font-bold mb-1">Login to start rizzing</h2>
        <input className="input-field" type="email" name="email" placeholder="Email" required />
        <input className="input-field" type="password" name="password" placeholder="Password" required />
        {errorMessage && <p className="text-red-500 text-sm -mt-1">{errorMessage}</p>}
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="text-center text-sm text-slate-600">
          <span>{flow === "signIn" ? "Don't have an account? " : "Already have an account? "}</span>
          <button
            type="button"
            className="text-blue-500 cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-3">
          <hr className="my-4 grow" />
          <span className="mx-4 text-slate-400 ">or</span>
          <hr className="my-4 grow" />
        </div>
        <button className="auth-button" onClick={() => signIn("anonymous")}>
          Sign in anonymously
        </button>
    </div>
  );
}
