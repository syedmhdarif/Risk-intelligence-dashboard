import { DisasterEvent, RegionalRisk, TrendDataPoint } from "./types";

export const disasterEvents: DisasterEvent[] = [
  {
    id: "evt-001",
    eventName: "Tropical Cyclone Mocha",
    country: "Myanmar",
    alertLevel: "red",
    populationExposed: "6.2M",
    eventType: "Tropical Cyclone",
    aiSummary:
      "Category 5 tropical cyclone making landfall with sustained winds exceeding 250 km/h. Critical infrastructure at risk across coastal regions.",
    date: "2025-05-14",
    coordinates: { lat: 20.15, lng: 92.87 },
    timeline: [
      { date: "2025-05-10", description: "Tropical depression formed over Bay of Bengal" },
      { date: "2025-05-12", description: "Upgraded to Category 3 cyclone" },
      { date: "2025-05-13", description: "Rapid intensification to Category 5" },
      { date: "2025-05-14", description: "Landfall in Rakhine State, Myanmar" },
    ],
    impactBreakdown: [
      { category: "Deaths", value: "145+" },
      { category: "Displaced", value: "1.2M" },
      { category: "Infrastructure Damage", value: "$3.2B" },
      { category: "Agricultural Loss", value: "850K hectares" },
    ],
    detailedAnalysis:
      "Cyclone Mocha represents the strongest tropical cyclone to make landfall in the Bay of Bengal region in the past decade. The storm's rapid intensification was driven by exceptionally warm sea surface temperatures. Coastal communities in Rakhine State bore the brunt of the impact, with storm surge reaching 4.5 meters in some areas. Humanitarian agencies are mobilizing emergency response operations.",
  },
  {
    id: "evt-002",
    eventName: "Earthquake Swarm - Turkey",
    country: "Turkey",
    alertLevel: "orange",
    populationExposed: "2.8M",
    eventType: "Earthquake",
    aiSummary:
      "Series of moderate earthquakes (M5.2-M6.1) detected along the East Anatolian Fault. Aftershock sequence ongoing with elevated seismic risk.",
    date: "2025-05-13",
    coordinates: { lat: 38.35, lng: 38.31 },
    timeline: [
      { date: "2025-05-12", description: "M5.2 initial event detected" },
      { date: "2025-05-13", description: "M6.1 mainshock recorded" },
      { date: "2025-05-13", description: "Multiple M4+ aftershocks" },
    ],
    impactBreakdown: [
      { category: "Deaths", value: "23" },
      { category: "Injured", value: "340+" },
      { category: "Buildings Damaged", value: "1,200+" },
    ],
    detailedAnalysis:
      "The earthquake swarm along the East Anatolian Fault follows the devastating 2023 earthquakes in the same region. Seismological analysis indicates stress transfer from previous events may be contributing to the current activity.",
  },
  {
    id: "evt-003",
    eventName: "Flooding - Bangladesh",
    country: "Bangladesh",
    alertLevel: "orange",
    populationExposed: "4.1M",
    eventType: "Flood",
    aiSummary:
      "Monsoon-driven flooding affecting northern and northeastern Bangladesh. River levels exceeding danger marks at multiple monitoring stations.",
    date: "2025-05-12",
    coordinates: { lat: 24.89, lng: 91.87 },
  },
];

export const regionalRisks: RegionalRisk[] = [
  { region: "South Asia", eventCount: 12, highestSeverity: "red", riskScore: 92, dominantDisasterType: "Flood" },
  { region: "Southeast Asia", eventCount: 8, highestSeverity: "red", riskScore: 87, dominantDisasterType: "Tropical Cyclone" },
  { region: "Middle East", eventCount: 6, highestSeverity: "orange", riskScore: 71, dominantDisasterType: "Earthquake" },
  { region: "East Africa", eventCount: 5, highestSeverity: "orange", riskScore: 65, dominantDisasterType: "Drought" },
  { region: "Central America", eventCount: 4, highestSeverity: "green", riskScore: 48, dominantDisasterType: "Flood" },
  { region: "Southern Europe", eventCount: 3, highestSeverity: "green", riskScore: 35, dominantDisasterType: "Wildfire" },
];

export const trendData: TrendDataPoint[] = [
  { date: "2025-05-08", eventCount: 5, severityBreakdown: { red: 1, orange: 2, green: 2 }, dominantType: "Flood" },
  { date: "2025-05-09", eventCount: 7, severityBreakdown: { red: 2, orange: 3, green: 2 }, dominantType: "Flood" },
  { date: "2025-05-10", eventCount: 6, severityBreakdown: { red: 1, orange: 3, green: 2 }, dominantType: "Earthquake" },
  { date: "2025-05-11", eventCount: 9, severityBreakdown: { red: 3, orange: 4, green: 2 }, dominantType: "Tropical Cyclone" },
  { date: "2025-05-12", eventCount: 11, severityBreakdown: { red: 4, orange: 4, green: 3 }, dominantType: "Tropical Cyclone" },
  { date: "2025-05-13", eventCount: 10, severityBreakdown: { red: 3, orange: 5, green: 2 }, dominantType: "Earthquake" },
  { date: "2025-05-14", eventCount: 12, severityBreakdown: { red: 4, orange: 5, green: 3 }, dominantType: "Tropical Cyclone" },
];
