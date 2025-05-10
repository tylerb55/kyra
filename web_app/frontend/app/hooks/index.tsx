"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "../contexts";

export const useProfileRedirect = (redirectToProfile: true) => {
    const { profile, loading } = useProfile();
    const router = useRouter();

    useEffect(() => {
        // skip if still loading
        if (loading) return;

        // if profile is incomplete and we should redirect
        if (redirectToProfile) {
            router.push("/profile");
        }

        // If profile is complete and we should Not be on the profile page
        if (!redirectToProfile) {
            router.push("/chat");
        }
    }, [profile, loading, router, redirectToProfile]);

    return { isProfileComplete: !redirectToProfile, loading };
};










