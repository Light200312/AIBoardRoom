import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadLocalEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadLocalEnv();

function defineTool(config) {
  return config;
}

function getOpenRouterApiKeys() {
  return [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY1,
  ].filter((key, index, arr) => key && arr.indexOf(key) === index);
}

function getToolText(result) {
  if (typeof result === "string") return result;
  if (result && typeof result.text === "string") return result.text;
  if (result?.content?.[0]?.text) return result.content[0].text;
  return JSON.stringify(result ?? {});
}

const TOOL_REGISTRY = {
  wiki_search: defineTool({
    name: "wiki_search",
    description: "Search Wikipedia for factual background on people, concepts, events, and general knowledge topics.",
    topics: ["general", "history", "background", "education"],
    argsSchema: {
      query: "string - topic or keyword to search for",
    },
    async execute({ query }) {
      try {
        const search = await axios.get("https://en.wikipedia.org/w/api.php", {
          params: { action: "opensearch", search: query, limit: 1, format: "json" },
          headers: { "User-Agent": "CouncilTools/1.0 (educational project)" },
          timeout: 8000,
        });

        const title = search.data?.[1]?.[0];
        if (!title) return `No Wikipedia article found for: ${query}`;

        const summary = await axios.get(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
          {
            headers: { "User-Agent": "CouncilTools/1.0 (educational project)" },
            timeout: 8000,
          }
        );

        const { extract, content_urls: contentUrls } = summary.data || {};
        return `**${title}**\n\n${extract}\n\nSource: ${contentUrls?.desktop?.page || ""}`;
      } catch (error) {
        return `Wikipedia search failed: ${error.message}`;
      }
    },
  }),
  medical_search: defineTool({
    name: "medical_search",
    description: "Search PubMed for medical research papers, clinical topics, symptoms, treatments, and diagnosis support.",
    topics: ["medical", "health", "diagnosis", "treatment"],
    argsSchema: {
      query: "string - symptom, disease, treatment, drug, or medical question",
      max_results: "number (1-5, optional) - number of papers to return",
    },
    async execute({ query, max_results = 3 }) {
      try {
        const apiKey = process.env.NCBI_API_KEY;
        const baseParams = apiKey ? { api_key: apiKey } : {};

        const search = await axios.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", {
          params: {
            ...baseParams,
            db: "pubmed",
            term: query,
            retmax: Math.max(1, Math.min(5, Number(max_results) || 3)),
            retmode: "json",
            sort: "relevance",
          },
          timeout: 20000,
        });

        const ids = search.data?.esearchresult?.idlist;
        if (!ids?.length) return `No medical research found for: ${query}`;

        const summaries = await axios.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi", {
          params: {
            ...baseParams,
            db: "pubmed",
            id: ids.join(","),
            retmode: "json",
          },
          timeout: 20000,
        });

        const results = ids
          .map((id) => {
            const paper = summaries.data?.result?.[id];
            if (!paper?.title) return null;
            const authors = paper.authors?.slice(0, 2).map((author) => author.name).join(", ") || "Unknown";
            return `• **${paper.title}**\n  Authors: ${authors} | Published: ${paper.pubdate}\n  PubMed ID: ${id} | Link: https://pubmed.ncbi.nlm.nih.gov/${id}`;
          })
          .filter(Boolean)
          .join("\n\n");

        return `**PubMed results for "${query}"**\n\n${results}`;
      } catch (error) {
        return `Medical search failed: ${error.message}`;
      }
    },
  }),
  drug_info: defineTool({
    name: "drug_info",
    description: "Look up FDA drug labeling, warnings, dosage, and usage guidance for medications.",
    topics: ["medical", "drug", "prescription", "pharma"],
    argsSchema: {
      drug_name: "string - drug or medication name",
    },
    async execute({ drug_name: drugName }) {
      try {
        const queries = [
          `openfda.generic_name:"${drugName}"`,
          `openfda.brand_name:"${drugName}"`,
          `"${drugName}"`,
        ];

        let label = null;
        for (const search of queries) {
          try {
            const response = await axios.get("https://api.fda.gov/drug/label.json", {
              params: { search, limit: 1 },
              timeout: 8000,
            });
            label = response.data?.results?.[0] || null;
            if (label) break;
          } catch (error) {
            if (error.response?.status !== 404) throw error;
          }
        }

        if (!label) return `No FDA data found for drug: ${drugName}`;

        return [
          label.openfda?.brand_name?.[0] && `**Brand name:** ${label.openfda.brand_name[0]}`,
          label.openfda?.generic_name?.[0] && `**Generic name:** ${label.openfda.generic_name[0]}`,
          label.purpose?.[0] && `**Purpose:** ${label.purpose[0].slice(0, 300)}`,
          label.warnings?.[0] && `**Warnings:** ${label.warnings[0].slice(0, 300)}`,
          label.dosage_and_administration?.[0] &&
            `**Dosage:** ${label.dosage_and_administration[0].slice(0, 300)}`,
        ]
          .filter(Boolean)
          .join("\n\n");
      } catch (error) {
        return `Drug info lookup failed: ${error.message}`;
      }
    },
  }),
  find_hospital: defineTool({
    name: "find_hospital",
    description: "Find nearby hospitals, clinics, and medical facilities near a location using OpenStreetMap data.",
    topics: ["medical", "healthcare", "emergency", "local"],
    argsSchema: {
      condition: "string - condition or specialty to search around",
      location: "string - city, area, or address",
      radius_km: "number (1-20, optional) - radius in kilometers",
    },
    async execute({ condition, location, radius_km = 5 }) {
      try {
        const geo = await axios.get("https://nominatim.openstreetmap.org/search", {
          params: { q: location, format: "jsonv2", limit: 1 },
          headers: { "User-Agent": "CouncilTools/1.0 (educational project)", "Accept-Language": "en" },
          timeout: 8000,
        });

        if (!geo.data?.length) return `Could not find location: ${location}`;

        const { lat, lon, display_name: displayName } = geo.data[0];
        const radiusMeters = Math.max(1, Math.min(20, Number(radius_km) || 5)) * 1000;
        const overpassQuery = `
          [out:json][timeout:15];
          (
            node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
            node["amenity"="clinic"](around:${radiusMeters},${lat},${lon});
            node["amenity"="doctors"](around:${radiusMeters},${lat},${lon});
            node["healthcare"="hospital"](around:${radiusMeters},${lat},${lon});
          );
          out body 10;
        `.trim();

        const overpass = await axios.post("https://overpass-api.de/api/interpreter", overpassQuery, {
          headers: { "Content-Type": "text/plain" },
          timeout: 15000,
        });

        const elements = overpass.data?.elements || [];
        if (!elements.length) {
          return `No hospitals or clinics found within ${radius_km}km of ${displayName}. Try increasing the radius or searching a nearby major city.`;
        }

        const conditionLower = String(condition || "").toLowerCase();
        const keywordMatch = (tags) => JSON.stringify(tags || {}).toLowerCase().includes(conditionLower);

        const formatted = [
          ...elements.filter((element) => keywordMatch(element.tags)),
          ...elements.filter((element) => !keywordMatch(element.tags)),
        ]
          .slice(0, 7)
          .map((element, index) => {
            const tags = element.tags || {};
            const name = tags.name || tags["name:en"] || "Unnamed facility";
            const type = tags.amenity || tags.healthcare || "facility";
            const address =
              [tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ") || "Address not listed";
            const phone = tags.phone || tags["contact:phone"] || "Not listed";
            const specialty = tags["healthcare:speciality"] || tags.specialty || "";
            const mapLink = `https://www.openstreetmap.org/?mlat=${element.lat}&mlon=${element.lon}&zoom=17`;

            return [
              `${index + 1}. **${name}** (${type})`,
              `   Address: ${address}`,
              specialty && `   Specialty: ${specialty}`,
              `   Phone: ${phone}`,
              `   Map: ${mapLink}`,
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n\n");

        return `**Facilities near ${displayName} for "${condition}"** (${radius_km}km radius)\n\n${formatted}\n\nData from OpenStreetMap — availability may vary.`;
      } catch (error) {
        if (error.response?.status === 406) {
          return `Hospital search failed: the OpenStreetMap geocoder rejected the request for "${location}" (HTTP 406). Try a more specific place name, or retry later.`;
        }
        return `Hospital search failed: ${error.message}`;
      }
    },
  }),
  news_search: defineTool({
    name: "news_search",
    description: "Search recent news with publication dates and links using The Guardian API.",
    topics: ["current_events", "news", "politics", "recent"],
    argsSchema: {
      query: "string - news topic or keywords",
      max_results: "number (1-5, optional) - number of articles to return",
    },
    async execute({ query, max_results = 3 }) {
      try {
        const apiKey = process.env.GUARDIAN_API_KEY || "test";
        const response = await axios.get("https://content.guardianapis.com/search", {
          params: {
            q: query,
            "api-key": apiKey,
            "show-fields": "trailText",
            "page-size": Math.max(1, Math.min(5, Number(max_results) || 3)),
            "order-by": "relevance",
          },
          timeout: 8000,
        });

        const articles = response.data?.response?.results;
        if (!articles?.length) return `No news found for: ${query}`;

        return `**News: "${query}"**\n\n${articles
          .map(
            (article, index) =>
              `${index + 1}. **${article.webTitle}**\n   ${article.fields?.trailText || ""}\n   ${article.webPublicationDate?.slice(0, 10)} | ${article.webUrl}`
          )
          .join("\n\n")}`;
      } catch (error) {
        if (error.response?.status === 429) {
          return "News search failed: The Guardian API rate limit was reached for the current key. Add GUARDIAN_API_KEY in .env to use your own free quota.";
        }
        return `News search failed: ${error.message}`;
      }
    },
  }),
  stanford_encyclopedia: defineTool({
    name: "stanford_encyclopedia",
    description: "Search the Stanford Encyclopedia of Philosophy for rigorous philosophy and ethics background.",
    topics: ["philosophy", "ethics", "theory"],
    argsSchema: {
      topic: "string - philosophy topic or concept",
    },
    async execute({ topic }) {
      try {
        const slug = String(topic || "").toLowerCase().trim().replace(/\s+/g, "-");
        const response = await axios.get(`https://plato.stanford.edu/entries/${slug}/`, {
          headers: { "User-Agent": "CouncilTools/1.0 (educational project)" },
          timeout: 10000,
        });

        const preambleMatch = response.data?.match(/<div id="preamble"[^>]*>([\s\S]*?)<\/div>/);
        if (!preambleMatch) {
          return `No SEP entry found for: ${topic}. Try a different spelling or broader term.`;
        }

        const clean = preambleMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 800);
        return `**Stanford Encyclopedia: ${topic}**\n\n${clean}\n\nSource: https://plato.stanford.edu/entries/${slug}/`;
      } catch (error) {
        if (error.response?.status === 404) {
          return `No SEP entry for "${topic}". Try: plato.stanford.edu/contents.html for valid entry names.`;
        }
        return `Stanford Encyclopedia search failed: ${error.message}`;
      }
    },
  }),
  world_bank_data: defineTool({
    name: "world_bank_data",
    description: "Fetch World Bank economic indicators like GDP, inflation, unemployment, poverty, and population.",
    topics: ["economics", "policy", "country", "current_data"],
    argsSchema: {
      country: "string - country name or ISO code",
      indicator: 'string - one of "gdp", "population", "inflation", "poverty", "gdp_per_capita", "unemployment"',
      year: "number (optional) - specific year, otherwise most recent available",
    },
    async execute({ country, indicator, year }) {
      try {
        const indicatorMap = {
          gdp: "NY.GDP.MKTP.CD",
          population: "SP.POP.TOTL",
          inflation: "FP.CPI.TOTL.ZG",
          poverty: "SI.POV.DDAY",
          gdp_per_capita: "NY.GDP.PCAP.CD",
          unemployment: "SL.UEM.TOTL.ZS",
        };
        const labelMap = {
          gdp: "GDP (current USD)",
          population: "Population",
          inflation: "Inflation rate (%)",
          poverty: "Poverty rate <$2.15/day (%)",
          gdp_per_capita: "GDP per capita (USD)",
          unemployment: "Unemployment rate (%)",
        };

        const indicatorCode = indicatorMap[indicator];
        if (!indicatorCode) return `Invalid indicator "${indicator}" for World Bank lookup.`;

        const response = await axios.get(
          `https://api.worldbank.org/v2/country/${encodeURIComponent(country)}/indicator/${indicatorCode}`,
          {
            params: { format: "json", date: year ? year : "2000:2024", mrv: year ? undefined : 1 },
            timeout: 8000,
          }
        );

        const data = response.data?.[1];
        if (!data?.length) {
          return `No World Bank data found for ${country} — ${indicator}. Try an ISO code like "IN" or "US".`;
        }

        const record = data.find((item) => item.value !== null) || data[0];
        const formattedValue =
          record.value !== null
            ? indicator === "gdp" || indicator === "gdp_per_capita"
              ? `$${(record.value / 1e9).toFixed(2)} billion`
              : `${Number(record.value).toFixed(2)}`
            : "Data not available";

        return `**${record.country?.value || country} — ${labelMap[indicator]}**\nYear: ${record.date}\nValue: ${formattedValue}\n\nSource: World Bank Open Data`;
      } catch (error) {
        return `World Bank lookup failed: ${error.message}`;
      }
    },
  }),
  supreme_court_cases: defineTool({
    name: "supreme_court_cases",
    description: "Search US Supreme Court and federal cases for legal topics, precedents, and holdings.",
    topics: ["legal", "law", "court", "precedent"],
    argsSchema: {
      query: "string - legal topic, doctrine, or case name",
      max_results: "number (1-4, optional) - number of cases to return",
    },
    async execute({ query, max_results = 3 }) {
      try {
        const response = await axios.get("https://www.courtlistener.com/api/rest/v3/search/", {
          params: { q: query, type: "o", order_by: "score desc", page_size: Math.max(1, Math.min(4, Number(max_results) || 3)) },
          headers: { "User-Agent": "CouncilTools/1.0 (educational project)" },
          timeout: 10000,
        });

        const results = response.data?.results;
        if (!results?.length) return `No court cases found for: ${query}`;

        return `**Legal cases for "${query}"**\n\n${results
          .map((result, index) => {
            const snippet = result.snippet
              ? result.snippet.replace(/<[^>]+>/g, "").trim().slice(0, 300)
              : "No summary available";
            return `${index + 1}. **${result.caseName || "Unknown case"}** (${result.citation?.[0] || "No citation"})\n   Court: ${result.court || "Unknown court"} | Year: ${result.dateFiled?.slice(0, 4) || "Unknown year"}\n   ${snippet}`;
          })
          .join("\n\n")}\n\nSource: CourtListener`;
      } catch (error) {
        return `Legal search failed: ${error.message}`;
      }
    },
  }),
  arxiv_search: defineTool({
    name: "arxiv_search",
    description: "Search arXiv for research papers in AI, medicine, economics, physics, and technical topics.",
    topics: ["research", "science", "technical", "ai"],
    argsSchema: {
      query: "string - research topic or keywords",
      max_results: "number (1-5, optional) - number of papers to return",
    },
    async execute({ query, max_results = 3 }) {
      try {
        const response = await axios.get("https://export.arxiv.org/api/query", {
          params: {
            search_query: `all:${query}`,
            max_results: Math.max(1, Math.min(5, Number(max_results) || 3)),
            sortBy: "relevance",
            sortOrder: "descending",
          },
          headers: { "User-Agent": "CouncilTools/1.0 (educational project)" },
          timeout: 10000,
        });

        const entries = [...String(response.data || "").matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => match[1]);
        if (!entries.length) return `No arXiv papers found for: ${query}`;

        const getTagText = (xml, tag) =>
          xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1]?.trim() || "";

        return `**arXiv papers for "${query}"**\n\n${entries
          .map((entry, index) => {
            const title = getTagText(entry, "title").replace(/\s+/g, " ");
            const summary = getTagText(entry, "summary").replace(/\s+/g, " ").slice(0, 250);
            const published = getTagText(entry, "published").slice(0, 10);
            const id = getTagText(entry, "id");
            const authors = [...entry.matchAll(/<name>(.*?)<\/name>/g)].slice(0, 2).map((match) => match[1]).join(", ");
            return `${index + 1}. **${title}**\n   Authors: ${authors} | Published: ${published}\n   ${summary}...\n   Link: ${id}`;
          })
          .join("\n\n")}`;
      } catch (error) {
        return `arXiv search failed: ${error.message}`;
      }
    },
  }),
  country_profile: defineTool({
    name: "country_profile",
    description: "Get real geopolitical data about a country: capital, region, population, language, and currency.",
    topics: ["geopolitics", "country", "history", "policy"],
    argsSchema: {
      country: "string - country name",
    },
    async execute({ country }) {
      try {
        const response = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}`, {
          params: { fields: "name,capital,population,region,subregion,languages,borders,currencies,area,flags,gini" },
          timeout: 8000,
        });

        const countryInfo = response.data?.[0];
        if (!countryInfo) return `Country not found: ${country}`;

        const languages = Object.values(countryInfo.languages || {}).join(", ") || "N/A";
        const currencies =
          Object.values(countryInfo.currencies || {})
            .map((currency) => `${currency.name} (${currency.symbol})`)
            .join(", ") || "N/A";
        const borders = countryInfo.borders?.join(", ") || "None / Island nation";
        const gini = countryInfo.gini
          ? Object.entries(countryInfo.gini).map(([year, value]) => `${value} (${year})`)[0]
          : "N/A";

        return [
          `**${countryInfo.name?.common} (${countryInfo.name?.official})**`,
          `Region: ${countryInfo.region} — ${countryInfo.subregion}`,
          `Capital: ${countryInfo.capital?.[0] || "N/A"}`,
          `Population: ${countryInfo.population?.toLocaleString()}`,
          `Area: ${countryInfo.area?.toLocaleString()} km²`,
          `Languages: ${languages}`,
          `Currency: ${currencies}`,
          `Bordering countries (ISO): ${borders}`,
          `Gini coefficient: ${gini}`,
        ].join("\n");
      } catch (error) {
        if (error.response?.status === 404) {
          return `Country not found: ${country}. Try the full English name.`;
        }
        return `Country profile failed: ${error.message}`;
      }
    },
  }),
  fallacy_detector: defineTool({
    name: "fallacy_detector",
    description: "Detect logical fallacies inside an argument using an LLM-powered analyzer.",
    topics: ["debate", "logic", "rhetoric"],
    argsSchema: {
      argument: "string - the argument to analyze",
    },
    async execute({ argument }) {
      try {
        const openRouterKeys = getOpenRouterApiKeys();
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!openRouterKeys.length && !geminiKey) {
          return "Fallacy detector requires OPENROUTER_API_KEY, OPENROUTER_API_KEY1, or GEMINI_API_KEY in backend/tools/.env.";
        }

        const prompt = `Analyze this debate argument for logical fallacies. Respond ONLY with a JSON object.

Argument: "${argument}"

JSON format:
{
  "has_fallacy": true,
  "fallacies": [
    {
      "name": "Ad Hominem",
      "explanation": "one sentence explaining how it applies here",
      "severity": "minor|moderate|major"
    }
  ],
  "overall_assessment": "one sentence summary"
}`;

        let responseText = "";
        if (openRouterKeys.length) {
          let lastOpenRouterError = null;
          for (const apiKey of openRouterKeys) {
            try {
              const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                  model: "mistralai/mistral-7b-instruct",
                  messages: [{ role: "user", content: prompt }],
                  max_tokens: 300,
                  temperature: 0.1,
                },
                {
                  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
                  timeout: 15000,
                }
              );
              responseText = response.data?.choices?.[0]?.message?.content || "";
              break;
            } catch (error) {
              lastOpenRouterError = error;
            }
          }
          if (!responseText && lastOpenRouterError && !geminiKey) {
            throw lastOpenRouterError;
          }
        }

        if (!responseText && geminiKey) {
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.5-flash"}:generateContent?key=${geminiKey}`,
            {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 300, temperature: 0.1 },
            },
            { timeout: 15000 }
          );
          responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }

        const parsed = JSON.parse(String(responseText).replace(/```json|```/g, "").trim());
        if (!parsed.has_fallacy) return `No logical fallacies detected.\n${parsed.overall_assessment}`;

        return `Fallacies detected:\n\n${(parsed.fallacies || [])
          .map((fallacy) => `• **${fallacy.name}** [${fallacy.severity}]\n  ${fallacy.explanation}`)
          .join("\n")}\n\n**Assessment:** ${parsed.overall_assessment}`;
      } catch (error) {
        return `Fallacy detection failed: ${error.message}`;
      }
    },
  }),
  quote_search: defineTool({
    name: "quote_search",
    description: "Fetch verified quotes for notable people from Wikiquote.",
    topics: ["history", "quotes", "leadership", "background"],
    argsSchema: {
      person: "string - person's name",
    },
    async execute({ person }) {
      try {
        const encoded = encodeURIComponent(String(person || "").trim());
        const summary = await axios.get(`https://en.wikiquote.org/api/rest_v1/page/summary/${encoded}`, {
          headers: { "User-Agent": "CouncilTools/1.0 (educational project)" },
          timeout: 8000,
        });

        const raw = await axios.get("https://en.wikiquote.org/w/api.php", {
          params: { action: "parse", page: person, prop: "wikitext", format: "json" },
          headers: { "User-Agent": "CouncilTools/1.0 (educational project)" },
          timeout: 8000,
        });

        const quotes = String(raw.data?.parse?.wikitext?.["*"] || "")
          .split("\n")
          .filter((line) => line.startsWith("* ") && !line.startsWith("** "))
          .map((line) =>
            line
              .replace(/\[\[.*?\]\]/g, "")
              .replace(/'''|''|\{\{.*?\}\}/g, "")
              .replace(/\[.*?\]/g, "")
              .replace(/^[*\s]+/, "")
              .trim()
          )
          .filter((line) => line.length > 20 && line.length < 300)
          .slice(0, 5);

        if (!quotes.length) {
          return summary.data?.extract
            ? `**${person} (Wikiquote)**\n\n${summary.data.extract.slice(0, 500)}\n\nSource: https://en.wikiquote.org/wiki/${encoded}`
            : `No quotes found for: ${person}. Check the exact name spelling.`;
        }

        return `**Verified quotes — ${person}**\n\n${quotes
          .map((quote, index) => `${index + 1}. "${quote}"`)
          .join("\n\n")}\n\nSource: https://en.wikiquote.org/wiki/${encoded}`;
      } catch (error) {
        if (error.response?.status === 404) {
          return `No Wikiquote page for "${person}". Try the full name as it appears on Wikipedia.`;
        }
        return `Quote search failed: ${error.message}`;
      }
    },
  }),
  un_stats: defineTool({
    name: "un_stats",
    description: "Fetch UN-style development and sustainability metrics by country via World Bank-hosted indicators.",
    topics: ["country", "global", "development", "current_data"],
    argsSchema: {
      country_iso: "string - 3-letter country ISO code",
      stat: 'string - one of "co2_emissions", "energy_use", "hdi_proxy", "trade_gdp", "internet_users"',
    },
    async execute({ country_iso: countryIso, stat }) {
      try {
        const statMap = {
          co2_emissions: { code: "EN.ATM.CO2E.PC", label: "CO2 emissions (metric tons per capita)" },
          energy_use: { code: "EG.USE.PCAP.KG.OE", label: "Energy use (kg of oil equivalent per capita)" },
          hdi_proxy: { code: "SP.DYN.LE00.IN", label: "Life expectancy (HDI proxy, years)" },
          trade_gdp: { code: "NE.TRD.GNFS.ZS", label: "Trade as % of GDP" },
          internet_users: { code: "IT.NET.USER.ZS", label: "Internet users (% of population)" },
        };
        const mapped = statMap[stat];
        if (!mapped) return `Invalid UN stat "${stat}".`;

        const response = await axios.get(
          `https://api.worldbank.org/v2/country/${countryIso}/indicator/${mapped.code}`,
          {
            params: { format: "json", mrv: 1 },
            timeout: 8000,
          }
        );

        const record = response.data?.[1]?.find((item) => item.value !== null);
        if (!record) return `No UN stat available for ${countryIso} — ${stat}`;

        return `**${record.country?.value} — ${mapped.label}**\nYear: ${record.date}\nValue: ${Number(record.value).toFixed(2)}\n\nSource: World Bank / UN Data`;
      } catch (error) {
        return `UN stats failed: ${error.message}`;
      }
    },
  }),
};

const MODE_TOOL_PRIORITIES = {
  medical_consulting: ["medical_search", "drug_info", "find_hospital", "wiki_search"],
  "medical-consulting": ["medical_search", "drug_info", "find_hospital", "wiki_search"],
  learn_law: ["supreme_court_cases", "news_search", "wiki_search"],
  "learn-law": ["supreme_court_cases", "news_search", "wiki_search"],
  interview_simulator: ["news_search", "wiki_search", "arxiv_search"],
  "interview-simulator": ["news_search", "wiki_search", "arxiv_search"],
  historical: ["wiki_search", "quote_search", "country_profile", "news_search"],
  mentor: ["wiki_search", "news_search", "arxiv_search", "world_bank_data"],
  combat: ["fallacy_detector", "wiki_search", "news_search"],
};

function getToolByName(name) {
  return TOOL_REGISTRY[String(name || "").trim()] || null;
}

function listToolDefinitions() {
  return Object.values(TOOL_REGISTRY).map((tool) => ({
    name: tool.name,
    description: tool.description,
    topics: tool.topics,
    argsSchema: tool.argsSchema,
  }));
}

function getPreferredToolsForMode(discussionMode = "") {
  const prioritized = MODE_TOOL_PRIORITIES[String(discussionMode || "").trim()] || [];
  const seen = new Set();
  return [...prioritized, ...Object.keys(TOOL_REGISTRY)].filter((name) => {
    if (seen.has(name) || !TOOL_REGISTRY[name]) return false;
    seen.add(name);
    return true;
  });
}

function buildToolCatalogText({ discussionMode = "" } = {}) {
  const preferredSet = new Set(getPreferredToolsForMode(discussionMode));
  return listToolDefinitions()
    .sort((a, b) => {
      const aPreferred = preferredSet.has(a.name) ? 0 : 1;
      const bPreferred = preferredSet.has(b.name) ? 0 : 1;
      return aPreferred - bPreferred || a.name.localeCompare(b.name);
    })
    .map((tool) => {
      const args = Object.entries(tool.argsSchema)
        .map(([key, value]) => `${key}: ${value}`)
        .join("; ");
      return `- ${tool.name}: ${tool.description} Args: ${args}`;
    })
    .join("\n");
}

async function executeToolCall({ toolName, args = {} }) {
  const tool = getToolByName(toolName);
  if (!tool) {
    return {
      ok: false,
      toolName: String(toolName || ""),
      args,
      text: `Unknown tool: ${toolName}`,
    };
  }

  const startedAt = Date.now();
  const text = getToolText(await tool.execute(args));

  return {
    ok: !/failed:/i.test(text) && !/^unknown tool:/i.test(text),
    toolName: tool.name,
    args,
    text,
    durationMs: Date.now() - startedAt,
  };
}

export {
  TOOL_REGISTRY,
  MODE_TOOL_PRIORITIES,
  listToolDefinitions,
  buildToolCatalogText,
  getPreferredToolsForMode,
  executeToolCall,
};
