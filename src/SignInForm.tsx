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
    <div className="w-full max-w-[460px] md:max-w-full mx-auto mt-10 px-3">
      <h1 className="text-4xl font-bold text-center mb-3 text-pink-600 font-sans tracking-tight">Rizz Rank</h1>
      <p className="text-center text-slate-500 mb-6 text-lg">Out-rizz your rivals, charm your way through the ranks</p>
      <div className="flex flex-col md:flex-row gap-3 items-start justify-center">
      <div className="flex flex-col w-full h-max gap-3 mb-6 bg-white rounded-2xl shadow-lg px-8 py-4">
      <h2 className="text-xl font-bold text-center mb-2 text-pink-500">Top 3 Rizzer</h2>
        {topThree.map((user, index) => (
          <div
            key={user._id}
            className="flex items-center gap-4 justify-between p-3 rounded-2xl shadow bg-white"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-600 text-xl">{index + 1}</div>
              <div className="flex flex-col">
                <div className="font-semibold text-base text-gray-800">{user.username}</div>
                <div className="text-sm text-slate-500">{user.characterCount} characters - {user.messageCount} messages</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xl text-pink-600">{user.totalScore.toFixed(1)}</div>
              <div className="text-sm text-slate-500">Score</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 w-full bg-white rounded-2xl shadow-lg px-8 py-6">
        <form
          className="flex flex-col gap-4 "
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
          <h2 className="text-xl font-bold text-center mb-2 text-pink-500">Login to start rizzing</h2>
          <input className="rounded-full border border-pink-300 px-5 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition" type="email" name="email" placeholder="Email" required />
          <input className="rounded-full border border-pink-300 px-5 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition" type="password" name="password" placeholder="Password" required />
          {errorMessage && <p className="text-red-500 text-sm -mt-1">{errorMessage}</p>}
          <button className="rounded-full bg-pink-500 text-white font-bold px-8 py-3 shadow hover:bg-pink-600 active:bg-pink-700 transition" type="submit" disabled={submitting}>
            {flow === "signIn" ? "Sign in" : "Sign up"}
          </button>
          <div className="text-center text-sm text-slate-600">
            <span>{flow === "signIn" ? "Don't have an account? " : "Already have an account? "}</span>
            <button
              type="button"
              className="text-pink-500 font-bold underline underline-offset-2 cursor-pointer"
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
        <button className="rounded-full bg-pink-500 text-white font-bold px-8 py-3 shadow hover:bg-pink-600 active:bg-pink-700 transition" onClick={() => signIn("anonymous")}>
          Sign in anonymously
        </button>
      </div>
      </div>
    </div>
  );
}
