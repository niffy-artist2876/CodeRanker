import axios from "axios";

export async function fetchCodeforces(handle) {
  const url = `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`;
  const { data } = await axios.get(url, { timeout: 10000 });
  if (data.status !== "OK" || !data.result?.length) throw new Error("CF failed");
  const u = data.result[0];
  return {
    rating: u.rating ?? null,
    rank: u.rank ?? null,
    maxRating: u.maxRating ?? null,
    maxRank: u.maxRank ?? null
  };
}

export async function fetchLeetCode(username) {
  const query = {
    query: `query getUser($username: String!) {
      matchedUser(username: $username) {
        profile { ranking }
        submitStatsGlobal { acSubmissionNum { difficulty count } }
      }
    }`,
    variables: { username }
  };
  const { data } = await axios.post("https://leetcode.com/graphql", query, {
    headers: { "Content-Type": "application/json" }, timeout: 10000
  });
  const mu = data?.data?.matchedUser;
  if (!mu) throw new Error("LC failed");
  const arr = mu.submitStatsGlobal.acSubmissionNum;
  const get = (d) => (arr.find(x => x.difficulty == d)?.count) ?? 0;
  return {
    totalSolved: get("All"),
    easySolved: get("Easy"),
    mediumSolved: get("Medium"),
    hardSolved: get("Hard"),
    ranking: mu.profile?.ranking ?? null
  };
}
