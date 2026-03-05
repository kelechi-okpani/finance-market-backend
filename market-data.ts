export type AssetClass =
    | "stock" | "bond" | "etf" | "mutual_fund"
    | "commodity" | "gold" | "futures" | "options" | "bitcoin";

export interface Asset {
    // Common properties for all assets
    id: string;
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: string;
    type?: string;

    // Optional properties - These must exist here to be allowed in your objects
    marketCap?: string;    // Used by Stocks, ETFs, Bitcoin
    yield?: string;        // Used by Bonds
    expiry?: string;       // Used by Futures, Options
    strike?: number;       // Used by Options
    openInterest?: string; // Used by Futures, Options
    sector?: string;       // Used by Stocks
}




export const Stocks: Asset[] = [
    { id: "s1", symbol: "AAPL", name: "Apple Inc.", price: 182.52, change: 1.20, changePercent: 0.66, volume: "52M", marketCap: "2.82T", sector: "Technology" },
    { id: "s2", symbol: "MSFT", name: "Microsoft Corp.", price: 405.32, change: -2.15, changePercent: -0.53, volume: "22M", marketCap: "3.01T", sector: "Technology" },
    { id: "s3", symbol: "GOOGL", name: "Alphabet Inc.", price: 145.12, change: 0.85, changePercent: 0.59, volume: "28M", marketCap: "1.81T", sector: "Communication Services" },
    { id: "s4", symbol: "AMZN", name: "Amazon.com Inc.", price: 175.05, change: 3.40, changePercent: 1.98, volume: "35M", marketCap: "1.81T", sector: "Consumer Cyclical" },
    { id: "s5", symbol: "NVDA", name: "NVIDIA Corp.", price: 726.13, change: 15.20, changePercent: 2.14, volume: "44M", marketCap: "1.79T", sector: "Technology" },
    { id: "s6", symbol: "TSLA", name: "Tesla, Inc.", price: 195.40, change: -4.20, changePercent: -2.10, volume: "95M", marketCap: "620B", sector: "Consumer Cyclical" },
    { id: "s7", symbol: "META", name: "Meta Platforms", price: 485.10, change: 11.30, changePercent: 2.38, volume: "18M", marketCap: "1.24T", sector: "Communication Services" },
    { id: "s8", symbol: "BRK.B", name: "Berkshire Hathaway", price: 408.20, change: 1.50, changePercent: 0.37, volume: "3M", marketCap: "880B", sector: "Financial Services" },
    { id: "s9", symbol: "LLY", name: "Eli Lilly", price: 742.15, change: 8.90, changePercent: 1.21, volume: "4M", marketCap: "705B", sector: "Healthcare" },
    { id: "s10", symbol: "V", name: "Visa Inc.", price: 280.45, change: -1.10, changePercent: -0.39, volume: "6M", marketCap: "560B", sector: "Financial Services" },
    { id: "s11", symbol: "JPM", name: "JPMorgan Chase", price: 185.30, change: 0.45, changePercent: 0.24, volume: "10M", marketCap: "535B", sector: "Financial Services" },
    { id: "s12", symbol: "WMT", name: "Walmart Inc.", price: 172.10, change: 2.10, changePercent: 1.23, volume: "15M", marketCap: "460B", sector: "Consumer Defensive" },
    { id: "s13", symbol: "MA", name: "Mastercard Inc.", price: 462.80, change: -3.20, changePercent: -0.69, volume: "2M", marketCap: "430B", sector: "Financial Services" },
    { id: "s14", symbol: "UNH", name: "UnitedHealth Group", price: 525.12, change: 4.50, changePercent: 0.86, volume: "3M", marketCap: "485B", sector: "Healthcare" },
    { id: "s15", symbol: "COST", name: "Costco Wholesale", price: 725.40, change: 6.70, changePercent: 0.93, volume: "2M", marketCap: "320B", sector: "Consumer Defensive" }
];




export const AllBonds: Asset[] = [
    { id: "b1", symbol: "US10Y", name: "US Treasury 10Y", price: 98.25, change: -0.05, changePercent: -0.05, volume: "N/A", yield: "4.25%", type: "Government" },
    { id: "b2", symbol: "US2Y", name: "US Treasury 2Y", price: 99.10, change: 0.02, changePercent: 0.02, volume: "N/A", yield: "4.62%", type: "Government" },
    { id: "b3", symbol: "US30Y", name: "US Treasury 30Y", price: 94.50, change: -0.12, changePercent: -0.13, volume: "N/A", yield: "4.38%", type: "Government" },
    { id: "b4", symbol: "AAPL26", name: "Apple Corp 2026", price: 102.15, change: 0.10, changePercent: 0.10, volume: "150K", yield: "3.85%", type: "Corporate" },
    { id: "b5", symbol: "MSFT30", name: "Microsoft Corp 2030", price: 105.40, change: 0.15, changePercent: 0.14, volume: "80K", yield: "4.10%", type: "Corporate" },
    { id: "b6", symbol: "UK10Y", name: "UK Gilt 10Y", price: 101.20, change: -0.08, changePercent: -0.08, volume: "N/A", yield: "4.05%", type: "Government" },
    { id: "b7", symbol: "GER10Y", name: "Germany Bund 10Y", price: 103.50, change: -0.02, changePercent: -0.02, volume: "N/A", yield: "2.35%", type: "Government" },
    { id: "b8", symbol: "JPM28", name: "JPM Chase 2028", price: 97.80, change: -0.20, changePercent: -0.20, volume: "200K", yield: "5.15%", type: "Corporate" },
    { id: "b9", symbol: "TSLA25", name: "Tesla Note 2025", price: 100.05, change: 0.01, changePercent: 0.01, volume: "45K", yield: "5.50%", type: "Corporate" },
    { id: "b10", symbol: "FGN2027", name: "Nigeria FGN MAR 2027", price: 88.40, change: 0.50, changePercent: 0.57, volume: "1.2M", yield: "16.28%", type: "Government" },
    { id: "b11", symbol: "CAT35", name: "Caterpillar 2035", price: 92.10, change: -0.30, changePercent: -0.32, volume: "30K", yield: "4.95%", type: "Corporate" },
    { id: "b12", symbol: "DIS2040", name: "Disney Corp 2040", price: 85.60, change: -0.45, changePercent: -0.52, volume: "12K", yield: "5.75%", type: "Corporate" },
    { id: "b13", symbol: "US5Y", name: "US Treasury 5Y", price: 99.45, change: 0.01, changePercent: 0.01, volume: "N/A", yield: "4.31%", type: "Government" },
    { id: "b14", symbol: "BofA29", name: "Bank of America 2029", price: 96.25, change: -0.15, changePercent: -0.16, volume: "110K", yield: "5.30%", type: "Corporate" },
    { id: "b15", symbol: "CAN10Y", name: "Canada 10Y Bond", price: 100.80, change: 0.05, changePercent: 0.05, volume: "N/A", yield: "3.45%", type: "Government" }
];



export const ETFs: Asset[] = [
    { id: "e1", symbol: "SPY", name: "SPDR S&P 500 ETF", price: 501.20, change: 2.45, changePercent: 0.49, volume: "65M", marketCap: "495B", type: "Index" },
    { id: "e2", symbol: "QQQ", name: "Invesco QQQ Trust", price: 435.15, change: 4.10, changePercent: 0.95, volume: "42M", marketCap: "245B", type: "Index" },
    { id: "e3", symbol: "IWM", name: "iShares Russell 2000", price: 205.30, change: -1.20, changePercent: -0.58, volume: "25M", marketCap: "65B", type: "Small Cap" },
    { id: "e4", symbol: "VTI", name: "Vanguard Total Stock", price: 252.10, change: 1.15, changePercent: 0.46, volume: "3M", marketCap: "375B", type: "Broad Market" },
    { id: "e5", symbol: "ARKK", name: "ARK Innovation ETF", price: 48.25, change: -0.95, changePercent: -1.93, volume: "12M", marketCap: "8B", type: "Thematic" },
    { id: "e6", symbol: "SMH", name: "VanEck Semiconductor", price: 215.40, change: 5.80, changePercent: 2.77, volume: "6M", marketCap: "15B", type: "Sector" },
    { id: "e7", symbol: "XLF", name: "Financial Select SPDR", price: 40.15, change: 0.12, changePercent: 0.30, volume: "38M", marketCap: "35B", type: "Sector" },
    { id: "e8", symbol: "VGT", name: "Vanguard Information Tech", price: 512.45, change: 6.20, changePercent: 1.22, volume: "1M", marketCap: "62B", type: "Sector" },
    { id: "e9", symbol: "IEFA", name: "iShares Core MSCI EAFE", price: 78.30, change: -0.25, changePercent: -0.32, volume: "8M", marketCap: "112B", type: "International" },
    { id: "e10", symbol: "VWO", name: "Vanguard Emerging Markets", price: 41.50, change: 0.45, changePercent: 1.10, volume: "14M", marketCap: "75B", type: "International" },
    { id: "e11", symbol: "DIA", name: "SPDR Dow Jones Industrial", price: 388.12, change: 1.40, changePercent: 0.36, volume: "4M", marketCap: "32B", type: "Index" },
    { id: "e12", symbol: "SCHD", name: "Schwab US Dividend Equity", price: 78.90, change: 0.35, changePercent: 0.45, volume: "3M", marketCap: "52B", type: "Dividend" },
    { id: "e13", symbol: "TLT", name: "iShares 20+ Year Treasury", price: 92.45, change: -0.85, changePercent: -0.91, volume: "30M", marketCap: "48B", type: "Bond ETF" },
    { id: "e14", symbol: "XLE", name: "Energy Select SPDR", price: 85.12, change: -1.45, changePercent: -1.67, volume: "15M", marketCap: "38B", type: "Sector" },
    { id: "e15", symbol: "VNQ", name: "Vanguard Real Estate", price: 84.30, change: 0.65, changePercent: 0.78, volume: "5M", marketCap: "32B", type: "Sector" }
];



export const MutualFunds: Asset[] = [
    { id: "m1", symbol: "VFIAX", name: "Vanguard 500 Index Admiral", price: 462.15, change: 2.10, changePercent: 0.46, volume: "N/A", type: "Index" },
    { id: "m2", symbol: "VTSAX", name: "Vanguard Total Stock Admiral", price: 118.40, change: 0.52, changePercent: 0.44, volume: "N/A", type: "Broad Market" },
    { id: "m3", symbol: "VWUSX", name: "Vanguard US Growth", price: 154.20, change: 1.85, changePercent: 1.21, volume: "N/A", type: "Growth" },
    { id: "m4", symbol: "FNILX", name: "Fidelity ZERO Large Cap", price: 18.25, change: 0.08, changePercent: 0.44, volume: "N/A", type: "Zero Fee" },
    { id: "m5", symbol: "VEMAX", name: "Vanguard Emerging Markets Admiral", price: 35.12, change: 0.40, changePercent: 1.15, volume: "N/A", type: "International" },
    { id: "m6", symbol: "VBTLX", name: "Vanguard Total Bond Market", price: 9.45, change: -0.02, changePercent: -0.21, volume: "N/A", type: "Fixed Income" },
    { id: "m7", symbol: "PRGFX", name: "T. Rowe Price Growth Stock", price: 105.30, change: 1.45, changePercent: 1.40, volume: "N/A", type: "Growth" },
    { id: "m8", symbol: "VGHCX", name: "Vanguard Health Care", price: 225.10, change: -1.20, changePercent: -0.53, volume: "N/A", type: "Sector" },
    { id: "m9", symbol: "SWPPX", name: "Schwab S&P 500 Index", price: 78.45, change: 0.35, changePercent: 0.45, volume: "N/A", type: "Index" },
    { id: "m10", symbol: "FCNTX", name: "Fidelity Contrafund", price: 17.15, change: 0.15, changePercent: 0.88, volume: "N/A", type: "Growth" },
    { id: "m11", symbol: "VTMGX", name: "Vanguard Developed Markets Index", price: 15.80, change: -0.05, changePercent: -0.32, volume: "N/A", type: "International" },
    { id: "m12", symbol: "FSKAX", name: "Fidelity Total Market Index", price: 132.10, change: 0.60, changePercent: 0.46, volume: "N/A", type: "Broad Market" },
    { id: "m13", symbol: "VIGAX", name: "Vanguard Growth Index Admiral", price: 168.45, change: 2.10, changePercent: 1.26, volume: "N/A", type: "Growth" },
    { id: "m14", symbol: "LCEFX", name: "Invesco Diversified Dividend", price: 24.12, change: 0.05, changePercent: 0.21, volume: "N/A", type: "Value" },
    { id: "m15", symbol: "VMFXX", name: "Vanguard Federal Money Market", price: 1.00, change: 0.00, changePercent: 0.00, volume: "N/A", type: "Money Market" }
];

export const Commodities: Asset[] = [
    { id: "c1", symbol: "WTI", name: "Crude Oil WTI", price: 78.45, change: -1.25, changePercent: -1.57, volume: "350K", type: "Energy" },
    { id: "c2", symbol: "BRENT", name: "Brent Crude", price: 82.30, change: -1.10, changePercent: -1.32, volume: "280K", type: "Energy" },
    { id: "c3", symbol: "NATGAS", name: "Natural Gas", price: 1.85, change: 0.04, changePercent: 2.21, volume: "180K", type: "Energy" },
    { id: "c4", symbol: "COPPER", name: "Copper High Grade", price: 3.82, change: -0.05, changePercent: -1.29, volume: "45K", type: "Industrial Metal" },
    { id: "c5", symbol: "CORN", name: "Corn Futures", price: 432.50, change: 4.50, changePercent: 1.05, volume: "95K", type: "Agriculture" },
    { id: "c6", symbol: "WHEAT", name: "Wheat Futures", price: 565.10, change: -2.30, changePercent: -0.41, volume: "60K", type: "Agriculture" },
    { id: "c7", symbol: "SOYBN", name: "Soybeans", price: 1162.40, change: 12.00, changePercent: 1.04, volume: "55K", type: "Agriculture" },
    { id: "c8", symbol: "COFFEE", name: "Coffee C", price: 188.35, change: 3.10, changePercent: 1.67, volume: "22K", type: "Agriculture" },
    { id: "c9", symbol: "SUGAR", name: "Sugar No. 11", price: 22.45, change: -0.45, changePercent: -1.97, volume: "35K", type: "Agriculture" },
    { id: "c10", symbol: "ALUM", name: "Aluminum", price: 2185.00, change: 15.50, changePercent: 0.71, volume: "12K", type: "Industrial Metal" },
    { id: "c11", symbol: "PLAT", name: "Platinum", price: 915.40, change: -8.20, changePercent: -0.89, volume: "8K", type: "Precious Metal" },
    { id: "c12", symbol: "PALL", name: "Palladium", price: 965.10, change: 12.45, changePercent: 1.31, volume: "5K", type: "Precious Metal" },
    { id: "c13", symbol: "COTTON", name: "Cotton No. 2", price: 92.15, change: 0.85, changePercent: 0.93, volume: "15K", type: "Agriculture" },
    { id: "c14", symbol: "LIVESTK", name: "Live Cattle", price: 185.30, change: 0.45, changePercent: 0.24, volume: "20K", type: "Livestock" },
    { id: "c15", symbol: "HEATOL", name: "Heating Oil", price: 2.72, change: -0.05, changePercent: -1.81, volume: "18K", type: "Energy" }
];


export const Gold: Asset[] = [
    { id: "g1", symbol: "XAU/USD", name: "Spot Gold", price: 2024.50, change: 12.30, changePercent: 0.61, volume: "450K", type: "Precious Metal" },
    { id: "g2", symbol: "XAG/USD", name: "Spot Silver", price: 22.85, change: -0.15, changePercent: -0.65, volume: "1.2M", type: "Precious Metal" },
    { id: "g3", symbol: "GLD", name: "SPDR Gold Shares", price: 187.45, change: 1.15, changePercent: 0.62, volume: "8M", type: "ETF" },
    { id: "g4", symbol: "IAU", name: "iShares Gold Trust", price: 38.90, change: 0.24, changePercent: 0.62, volume: "5M", type: "ETF" },
    { id: "g5", symbol: "SLV", name: "iShares Silver Trust", price: 20.95, change: -0.12, changePercent: -0.57, volume: "15M", type: "ETF" },
    { id: "g6", symbol: "GDX", name: "Gold Miners ETF", price: 28.35, change: 0.45, changePercent: 1.61, volume: "22M", type: "Mining ETF" },
    { id: "g7", symbol: "GDXJ", name: "Junior Gold Miners", price: 34.12, change: 0.85, changePercent: 2.55, volume: "12M", type: "Mining ETF" },
    { id: "g8", symbol: "NEM", name: "Newmont Corp", price: 32.45, change: 0.35, changePercent: 1.09, volume: "8M", type: "Mining Stock" },
    { id: "g9", symbol: "GOLD", name: "Barrick Gold", price: 14.85, change: 0.12, changePercent: 0.82, volume: "15M", type: "Mining Stock" },
    { id: "g10", symbol: "PAAS", name: "Pan American Silver", price: 13.20, change: -0.10, changePercent: -0.75, volume: "4M", type: "Mining Stock" },
    { id: "g11", symbol: "WPM", name: "Wheaton Precious Metals", price: 42.15, change: 0.65, changePercent: 1.57, volume: "2M", type: "Streaming" },
    { id: "g12", symbol: "FNV", name: "Franco-Nevada", price: 108.40, change: 1.20, changePercent: 1.12, volume: "1M", type: "Streaming" },
    { id: "g13", symbol: "XAU/EUR", name: "Gold / Euro", price: 1875.20, change: 15.40, changePercent: 0.83, volume: "N/A", type: "Forex" },
    { id: "g14", symbol: "XAU/GBP", name: "Gold / British Pound", price: 1605.30, change: 10.20, changePercent: 0.64, volume: "N/A", type: "Forex" },
    { id: "g15", symbol: "PHYS", name: "Sprott Physical Gold", price: 17.12, change: 0.10, changePercent: 0.59, volume: "2M", type: "Closed-End Fund" }
];


export const Futures: Asset[] = [
    { id: "f1", symbol: "ESH6", name: "S&P 500 E-Mini Mar '26", price: 5012.25, change: 15.50, changePercent: 0.31, volume: "1.2M", expiry: "2026-03-20", openInterest: "2.8M" },
    { id: "f2", symbol: "NQH6", name: "Nasdaq 100 E-Mini Mar '26", price: 17845.50, change: 125.75, changePercent: 0.71, volume: "650K", expiry: "2026-03-20", openInterest: "1.1M" },
    { id: "f3", symbol: "CLJ26", name: "Crude Oil Apr '26", price: 78.15, change: -0.45, changePercent: -0.57, volume: "320K", expiry: "2026-04-20", openInterest: "450K" },
    { id: "f4", symbol: "GCJ26", name: "Gold Futures Apr '26", price: 2035.40, change: 11.20, changePercent: 0.55, volume: "180K", expiry: "2026-04-28", openInterest: "520K" },
    { id: "f5", symbol: "ZBH6", name: "30Y Treasury Bond Mar '26", price: 118.12, change: -0.25, changePercent: -0.21, volume: "250K", expiry: "2026-03-21", openInterest: "850K" },
    { id: "f6", symbol: "YMH6", name: "Dow E-Mini Mar '26", price: 38650.00, change: 45.00, changePercent: 0.12, volume: "150K", expiry: "2026-03-20", openInterest: "320K" },
    { id: "f7", symbol: "RTYH6", name: "Russell 2000 E-Mini Mar '26", price: 2045.20, change: -8.40, changePercent: -0.41, volume: "210K", expiry: "2026-03-20", openInterest: "410K" },
    { id: "f8", symbol: "HGK26", name: "Copper May '26", price: 3.85, change: -0.02, changePercent: -0.52, volume: "45K", expiry: "2026-05-27", openInterest: "180K" },
    { id: "f9", symbol: "NGJ26", name: "Natural Gas Apr '26", price: 1.92, change: 0.05, changePercent: 2.67, volume: "140K", expiry: "2026-03-26", openInterest: "390K" },
    { id: "f10", symbol: "ZCK26", name: "Corn May '26", price: 445.50, change: 2.25, changePercent: 0.51, volume: "85K", expiry: "2026-05-14", openInterest: "620K" },
    { id: "f11", symbol: "ZWK26", name: "Wheat May '26", price: 578.25, change: -4.50, changePercent: -0.77, volume: "55K", expiry: "2026-05-14", openInterest: "410K" },
    { id: "f12", symbol: "DXH6", name: "US Dollar Index Mar '26", price: 104.15, change: 0.22, changePercent: 0.21, volume: "35K", expiry: "2026-03-16", openInterest: "120K" },
    { id: "f13", symbol: "SIK26", name: "Silver May '26", price: 23.15, change: -0.15, changePercent: -0.64, volume: "65K", expiry: "2026-05-27", openInterest: "210K" },
    { id: "f14", symbol: "VXH6", name: "VIX Futures Mar '26", price: 15.45, change: 0.85, changePercent: 5.82, volume: "95K", expiry: "2026-03-18", openInterest: "340K" },
    { id: "f15", symbol: "BTH6", name: "Bitcoin Futures Mar '26", price: 52450.00, change: 1100.00, changePercent: 2.14, volume: "12K", expiry: "2026-03-27", openInterest: "25K" }
];


export const Options: Asset[] = [
    { id: "o1", symbol: "AAPL260320C00190000", name: "AAPL $190 Call 03/20", price: 4.25, change: 0.45, changePercent: 11.84, volume: "12K", strike: 190.00, expiry: "2026-03-20", openInterest: "45K" },
    { id: "o2", symbol: "TSLA260619P00150000", name: "TSLA $150 Put 06/19", price: 8.10, change: -1.20, changePercent: -12.90, volume: "5K", strike: 150.00, expiry: "2026-06-19", openInterest: "18K" },
    { id: "o3", symbol: "SPXW260320C05100000", name: "SPX $5100 Call 03/20", price: 42.50, change: 5.20, changePercent: 13.94, volume: "25K", strike: 5100.00, expiry: "2026-03-20", openInterest: "110K" },
    { id: "o4", symbol: "NVDA260320C00800000", name: "NVDA $800 Call 03/20", price: 15.40, change: 2.80, changePercent: 22.22, volume: "35K", strike: 800.00, expiry: "2026-03-20", openInterest: "62K" },
    { id: "o5", symbol: "MSFT260417C00420000", name: "MSFT $420 Call 04/17", price: 12.15, change: 1.05, changePercent: 9.46, volume: "8K", strike: 420.00, expiry: "2026-04-17", openInterest: "32K" },
    { id: "o6", symbol: "AMZN260320P00160000", name: "AMZN $160 Put 03/20", price: 3.10, change: -0.85, changePercent: -21.52, volume: "15K", strike: 160.00, expiry: "2026-03-20", openInterest: "55K" },
    { id: "o7", symbol: "QQQ260320C00450000", name: "QQQ $450 Call 03/20", price: 6.75, change: 0.95, changePercent: 16.38, volume: "45K", strike: 450.00, expiry: "2026-03-20", openInterest: "88K" },
    { id: "o8", symbol: "META260515C00500000", name: "META $500 Call 05/15", price: 21.40, change: 3.20, changePercent: 17.58, volume: "10K", strike: 500.00, expiry: "2026-05-15", openInterest: "25K" },
    { id: "o9", symbol: "AMD260320C00180000", name: "AMD $180 Call 03/20", price: 9.25, change: 1.45, changePercent: 18.59, volume: "22K", strike: 180.00, expiry: "2026-03-20", openInterest: "42K" },
    { id: "o10", symbol: "NFLX260619P00550000", name: "NFLX $550 Put 06/19", price: 28.50, change: -4.20, changePercent: -12.84, volume: "3K", strike: 550.00, expiry: "2026-06-19", openInterest: "12K" },
    { id: "o11", symbol: "JPM260320C00200000", name: "JPM $200 Call 03/20", price: 2.15, change: 0.10, changePercent: 4.88, volume: "6K", strike: 200.00, expiry: "2026-03-20", openInterest: "15K" },
    { id: "o12", symbol: "GOOG260320C00155000", name: "GOOG $155 Call 03/20", price: 4.80, change: 0.65, changePercent: 15.66, volume: "18K", strike: 155.00, expiry: "2026-03-20", openInterest: "38K" },
    { id: "o13", symbol: "BABA260320P00070000", name: "BABA $70 Put 03/20", price: 1.95, change: 0.25, changePercent: 14.71, volume: "14K", strike: 70.00, expiry: "2026-03-20", openInterest: "65K" },
    { id: "o14", symbol: "DIS260417C00120000", name: "DIS $120 Call 04/17", price: 5.40, change: 0.35, changePercent: 6.93, volume: "7K", strike: 120.00, expiry: "2026-04-17", openInterest: "22K" },
    { id: "o15", symbol: "XOM260320P00100000", name: "XOM $100 Put 03/20", price: 2.45, change: 0.60, changePercent: 32.43, volume: "11K", strike: 100.00, expiry: "2026-03-20", openInterest: "34K" }
];


export const Bitcoin: Asset[] = [
    { id: "btc1", symbol: "BTC", name: "Bitcoin", price: 90681.00, change: 1240.00, changePercent: 1.38, volume: "28.5B", marketCap: "1.78T", type: "Crypto" },
    { id: "eth1", symbol: "ETH", name: "Ethereum", price: 3094.20, change: 45.10, changePercent: 1.48, volume: "12.1B", marketCap: "373B", type: "Crypto" },
    { id: "sol1", symbol: "SOL", name: "Solana", price: 136.45, change: -2.10, changePercent: -1.52, volume: "3.2B", marketCap: "77B", type: "Crypto" },
    { id: "xrp1", symbol: "XRP", name: "Ripple", price: 2.09, change: 0.04, changePercent: 1.95, volume: "2.1B", marketCap: "126B", type: "Crypto" },
    { id: "bnb1", symbol: "BNB", name: "Binance Coin", price: 585.30, change: 12.40, changePercent: 2.16, volume: "1.5B", marketCap: "88B", type: "Crypto" },
    { id: "ada1", symbol: "ADA", name: "Cardano", price: 0.39, change: -0.01, changePercent: -2.50, volume: "450M", marketCap: "14B", type: "Crypto" },
    { id: "avax1", symbol: "AVAX", name: "Avalanche", price: 13.75, change: 0.35, changePercent: 2.61, volume: "680M", marketCap: "5.9B", type: "Crypto" },
    { id: "doge1", symbol: "DOGE", name: "Dogecoin", price: 0.13, change: -0.004, changePercent: -2.98, volume: "1.2B", marketCap: "23B", type: "Crypto" },
    { id: "trx1", symbol: "TRX", name: "TRON", price: 0.29, change: 0.01, changePercent: 3.57, volume: "350M", marketCap: "29B", type: "Crypto" },
    { id: "link1", symbol: "LINK", name: "Chainlink", price: 18.45, change: 0.65, changePercent: 3.65, volume: "520M", marketCap: "10.8B", type: "Crypto" },
    { id: "dot1", symbol: "DOT", name: "Polkadot", price: 7.25, change: -0.12, changePercent: -1.63, volume: "210M", marketCap: "9.2B", type: "Crypto" },
    { id: "matic1", symbol: "MATIC", name: "Polygon", price: 0.72, change: 0.02, changePercent: 2.85, volume: "310M", marketCap: "6.8B", type: "Crypto" },
    { id: "ltc1", symbol: "LTC", name: "Litecoin", price: 74.30, change: 1.20, changePercent: 1.64, volume: "410M", marketCap: "5.5B", type: "Crypto" },
    { id: "uni1", symbol: "UNI", name: "Uniswap", price: 7.85, change: -0.25, changePercent: -3.08, volume: "180M", marketCap: "4.7B", type: "Crypto" },
    { id: "shib1", symbol: "SHIB", name: "Shiba Inu", price: 0.0000086, change: 0.0000002, changePercent: 2.38, volume: "250M", marketCap: "5.1B", type: "Crypto" }
];



export const allAssets: Asset[] = [
    ...Stocks,
    ...AllBonds,
    ...ETFs,
    ...MutualFunds,
    ...Commodities,
    ...Gold,
    ...Futures,
    ...Options,
    ...Bitcoin
];
