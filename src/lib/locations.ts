/** Static destination list for trip creation; city options depend on the country. */
export const LOCATIONS: Readonly<Record<string, readonly string[]>> = {
  "Saudi Arabia": ["Riyadh", "Jeddah", "Dammam", "Al Khobar"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah"],
  Qatar: ["Doha", "Al Rayyan", "Al Wakrah"],
  Kuwait: ["Kuwait City", "Hawalli", "Salmiya"],
  Bahrain: ["Manama", "Muharraq", "Riffa"],
  Oman: ["Muscat", "Salalah", "Sohar"],
  Jordan: ["Amman", "Aqaba", "Irbid"],
  Egypt: ["Cairo", "Alexandria", "Giza"],
  Lebanon: ["Beirut", "Tripoli", "Sidon"],
  Morocco: ["Casablanca", "Rabat", "Marrakesh"],
  "United Kingdom": ["London", "Manchester", "Edinburgh"],
  France: ["Paris", "Lyon", "Marseille"],
  Germany: ["Berlin", "Munich", "Frankfurt"],
  Spain: ["Madrid", "Barcelona", "Valencia"],
  "United States": ["New York", "Washington", "Chicago", "San Francisco"],
};
