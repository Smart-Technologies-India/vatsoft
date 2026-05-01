"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master } from "@prisma/client";
import prisma from "../../../prisma/database";
import * as difflib from "@kv-systems/js-difflib";

interface SearchProductsByNameProps {
  product_name: string;
}

const   FUZZY_THRESHOLD = 0.8;
const MAX_RESULTS = 20;

function normalizeProductName(text: string): string {
  if (!text || text.trim() === "") return "";

  let s = text.trim();

  s = s.replace(/^\s*sl[_\-\s]+/i, "");
  s = s.replace(/(\d+)\s*pet\b/gi, "$1 mL PET");
  s = s.replace(/(\d+)\s*m\.?\s*l\.?\b/gi, "$1 mL");
  s = s.replace(/\brasberry\b/gi, "raspberry");
  s = s.replace(/\braspberri\b/gi, "raspberry");
  s = s.replace(/\bwhiskey\b/gi, "whisky");
  s = s.replace(/\bwishkey\b/gi, "whisky");
  s = s.replace(/\bwky\b/gi, "whisky");
  s = s.replace(/\bblend\b/gi, "blended");
  s = s.replace(/\(\s*pet\s*\)/gi, "(PET)");
  s = s.replace(/\s+/g, " ").trim();

  return s.toLowerCase();
}

function normalizePackType(nameText: string, packText: string = ""): "pet" | "bottle" {
  const combined = `${nameText} ${packText}`.toLowerCase();
  return combined.includes("pet") ? "pet" : "bottle";
}

function baseNameWithoutPet(text: string): string {
  let s = normalizeProductName(text);
  s = s.replace(/\(\s*pet\s*\)/gi, " ");
  s = s.replace(/\bpet\b/gi, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function fuzzySimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  const matcher = new difflib.SequenceMatcher(a, b);
  return matcher.ratio();
}

type MatchType = "exact" | "pack-aware" | "fuzzy";

interface CommodityCandidate {
  id: number;
  product_name: string;
  pack_type: string | null;
}

function getMatchScore(
  inputName: string,
  inputPackType: string,
  candidate: CommodityCandidate
): { matchType: MatchType; score: number } | null {
  const inputKey = normalizeProductName(inputName);
  const inputBase = baseNameWithoutPet(inputName);
  const inputPack = normalizePackType(inputName, inputPackType);

  const candidateKey = normalizeProductName(candidate.product_name);
  const candidateBase = baseNameWithoutPet(candidate.product_name);
  const candidatePack = normalizePackType(
    candidate.product_name,
    candidate.pack_type ?? ""
  );

  if (inputKey === candidateKey) {
    return { matchType: "exact", score: 1 };
  }

  if (inputBase === candidateBase && inputPack === candidatePack) {
    return { matchType: "pack-aware", score: 0.95 };
  }

  const fuzzyScore = fuzzySimilarity(inputBase, candidateBase);
  if (fuzzyScore >= FUZZY_THRESHOLD) {
    return { matchType: "fuzzy", score: fuzzyScore };
  }

  return null;
}

const SearchProductsByName = async (
  payload: SearchProductsByNameProps
): Promise<ApiResponseType<commodity_master[]>> => {
  const functionname: string = SearchProductsByName.name;

  try {
    const allCommodityNames = await prisma.commodity_master.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        product_name: true,
        pack_type: true,
      },
    });

    const matchedProducts = allCommodityNames
      .map((item) => {
        const match = getMatchScore(payload.product_name, "", item);
        if (!match) return null;
        return {
          id: item.id,
          score: match.score,
          matchType: match.matchType,
        };
      })
      .filter((item): item is { id: number; score: number; matchType: MatchType } => item !== null)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id - b.id;
      })
      .slice(0, MAX_RESULTS);

    if (matchedProducts.length === 0) {
      return createResponse({
        message: "Found 0 matching products",
        functionname,
        data: [],
      });
    }

    const orderById = new Map<number, number>();
    matchedProducts.forEach((item, index) => orderById.set(item.id, index));

    const products = await prisma.commodity_master.findMany({
      where: {
        id: {
          in: matchedProducts.map((item) => item.id),
        },
        deletedAt: null,
        status: "ACTIVE",
      },
    });

    products.sort(
      (a, b) => (orderById.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderById.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    );

    return createResponse({
      message: `Found ${products.length} matching products`,
      functionname,
      data: products,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
      data: [],
    });
  }
};

export default SearchProductsByName;
