from datetime import datetime, timezone
from app.db.mongodb import get_database

GUWAHATI_WARDS = [
    {
        "id": "GUW-W-01",
        "code": "W-01",
        "name": "Fancy Bazar Wholesale & Commercial",
        "zone": "Zone 1 - Guwahati Riverfront Market",
        "regionId": "guwahati",
        "population": 74200,
        "areaKm2": 3.2,
        "centroid": [91.741, 26.184],
        "vulnerability": {
            "hvi": 0.84,
            "ndvi": 0.12,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 16.2,
            "childrenPercent": 12.8,
            "outdoorWorkersEstimate": 10500,
            "pavedSurfacePercent": 86
        },
        "currentMetrics": {
            "tempC": 29.5,
            "utci": 35.8,
            "wbgt": 26.8,
            "humidity": 78,
            "heatIndex": 35.8,
            "riskLevel": "MODERATE"
        },
        "recommendedActions": [
            "Maintain drinking water stations at Fancy Bazar commercial hub",
            "Keep misting cooling booth active during peak afternoon humidity",
            "Routine monitoring of outdoor laborers and street vendors"
        ]
    },
    {
        "id": "GUW-W-02",
        "code": "W-02",
        "name": "Paltan Bazaar & Railway Terminus",
        "zone": "Zone 1 - Guwahati Central Transit",
        "regionId": "guwahati",
        "population": 78500,
        "areaKm2": 2.8,
        "centroid": [91.752, 26.179],
        "vulnerability": {
            "hvi": 0.86,
            "ndvi": 0.10,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 15.0,
            "childrenPercent": 11.5,
            "outdoorWorkersEstimate": 11200,
            "pavedSurfacePercent": 89
        },
        "currentMetrics": {
            "tempC": 29.8,
            "utci": 36.2,
            "wbgt": 27.1,
            "humidity": 76,
            "heatIndex": 36.2,
            "riskLevel": "MODERATE"
        },
        "recommendedActions": [
            "Open 24/7 air-cooled transit refuge hall at railway station",
            "Deploy cold ORS distribution booths at ASTC bus bay",
            "Stage NDMA heatstroke evacuation ambulance at station plaza"
        ]
    },
    {
        "id": "GUW-W-03",
        "code": "W-03",
        "name": "Panbazar & Cotton University Hub",
        "zone": "Zone 2 - Guwahati Institutional",
        "regionId": "guwahati",
        "population": 48900,
        "areaKm2": 3.0,
        "centroid": [91.748, 26.188],
        "vulnerability": {
            "hvi": 0.52,
            "ndvi": 0.38,
            "informalSettlementDensity": "MODERATE",
            "elderlyPercent": 14.2,
            "childrenPercent": 8.5,
            "outdoorWorkersEstimate": 3800,
            "pavedSurfacePercent": 62
        },
        "currentMetrics": {
            "tempC": 30.1,
            "utci": 36.5,
            "wbgt": 27.2,
            "humidity": 74,
            "heatIndex": 36.8,
            "riskLevel": "MODERATE"
        },
        "recommendedActions": [
            "Maintain campus shaded breezeways and hydration stations",
            "Reschedule outdoor sports and examinations to early mornings"
        ]
    },
    {
        "id": "GUW-W-04",
        "code": "W-04",
        "name": "Dispur Secretariat & Capital Complex",
        "zone": "Zone 2 - Dispur Capital Center",
        "regionId": "guwahati",
        "population": 54100,
        "areaKm2": 4.5,
        "centroid": [91.791, 26.143],
        "vulnerability": {
            "hvi": 0.48,
            "ndvi": 0.42,
            "informalSettlementDensity": "LOW",
            "elderlyPercent": 17.5,
            "childrenPercent": 9.0,
            "outdoorWorkersEstimate": 2900,
            "pavedSurfacePercent": 58
        },
        "currentMetrics": {
            "tempC": 30.3,
            "utci": 36.9,
            "wbgt": 27.4,
            "humidity": 73,
            "heatIndex": 37.1,
            "riskLevel": "MODERATE"
        },
        "recommendedActions": [
            "Monitor public transit stops on GS Road",
            "Ensure municipal administrative air-conditioning shelters remain operational"
        ]
    },
    {
        "id": "GUW-W-05",
        "code": "W-05",
        "name": "Ganeshguri Commercial Junction",
        "zone": "Zone 3 - Guwahati South East",
        "regionId": "guwahati",
        "population": 69400,
        "areaKm2": 3.4,
        "centroid": [91.782, 26.151],
        "vulnerability": {
            "hvi": 0.81,
            "ndvi": 0.15,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 14.8,
            "childrenPercent": 11.2,
            "outdoorWorkersEstimate": 8700,
            "pavedSurfacePercent": 84
        },
        "currentMetrics": {
            "tempC": 31.0,
            "utci": 38.2,
            "wbgt": 28.1,
            "humidity": 75,
            "heatIndex": 38.6,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Deploy mobile cold water bowser under Ganeshguri Flyover",
            "Distribute sun-protection gear to auto-rickshaw and delivery operators"
        ]
    },
    {
        "id": "GUW-W-06",
        "code": "W-06",
        "name": "Bhangagarh & GMCH Medical Corridor",
        "zone": "Zone 3 - Guwahati Central Health",
        "regionId": "guwahati",
        "population": 63200,
        "areaKm2": 3.1,
        "centroid": [91.768, 26.158],
        "vulnerability": {
            "hvi": 0.76,
            "ndvi": 0.22,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 19.5,
            "childrenPercent": 12.0,
            "outdoorWorkersEstimate": 6500,
            "pavedSurfacePercent": 80
        },
        "currentMetrics": {
            "tempC": 30.8,
            "utci": 37.8,
            "wbgt": 27.9,
            "humidity": 74,
            "heatIndex": 38.1,
            "riskLevel": "MODERATE"
        },
        "recommendedActions": [
            "Reserve dedicated heat emergency beds at GMCH Apex Center",
            "Operate misting canopy for waiting patients and attendants"
        ]
    }
]

DELHI_WARDS = [
    {
        "id": "DEL-W-01",
        "code": "W-01",
        "name": "Connaught Place & Rajiv Chowk Hub",
        "zone": "Zone 1 - Central Delhi",
        "regionId": "delhi",
        "population": 48500,
        "areaKm2": 3.2,
        "centroid": [77.218, 28.631],
        "vulnerability": {
            "hvi": 0.88,
            "ndvi": 0.12,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 18.5,
            "childrenPercent": 12.2,
            "outdoorWorkersEstimate": 8400,
            "pavedSurfacePercent": 82
        },
        "currentMetrics": {
            "tempC": 33.5,
            "utci": 39.2,
            "wbgt": 28.5,
            "humidity": 65,
            "heatIndex": 40.1,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Deploy emergency high-capacity water tanker to Rajiv Chowk radial",
            "Activate misting stations at bus terminals and Metro gates",
            "Issue advisory to street vendors and outdoor laborers"
        ]
    },
    {
        "id": "DEL-W-02",
        "code": "W-02",
        "name": "Chandni Chowk & Old Delhi Rail Terminus",
        "zone": "Zone 1 - North Central",
        "regionId": "delhi",
        "population": 89200,
        "areaKm2": 2.5,
        "centroid": [77.230, 28.656],
        "vulnerability": {
            "hvi": 0.91,
            "ndvi": 0.07,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 16.8,
            "childrenPercent": 14.5,
            "outdoorWorkersEstimate": 15600,
            "pavedSurfacePercent": 94
        },
        "currentMetrics": {
            "tempC": 34.2,
            "utci": 40.5,
            "wbgt": 29.1,
            "humidity": 64,
            "heatIndex": 41.5,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Station mobile drinking water tankers at Town Hall and Railway Exit",
            "Enforce midday shade rest period for pull-cart and delivery workers"
        ]
    },
    {
        "id": "DEL-W-03",
        "code": "W-03",
        "name": "Karol Bagh & Anand Parbat Industrial",
        "zone": "Zone 2 - West Central",
        "regionId": "delhi",
        "population": 72400,
        "areaKm2": 3.6,
        "centroid": [77.185, 28.652],
        "vulnerability": {
            "hvi": 0.85,
            "ndvi": 0.11,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 14.2,
            "childrenPercent": 12.0,
            "outdoorWorkersEstimate": 11400,
            "pavedSurfacePercent": 88
        },
        "currentMetrics": {
            "tempC": 33.8,
            "utci": 39.8,
            "wbgt": 28.8,
            "humidity": 63,
            "heatIndex": 40.8,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Install community ORS kiosks along commercial bazaars",
            "Deploy misting tent at metro interchange"
        ]
    }
]

GURGAON_WARDS = [
    {
        "id": "GUR-W-11",
        "code": "W-11",
        "name": "DLF Cyber City & Udyog Vihar",
        "zone": "Zone 8 - Gurgaon North (Cyber Hub)",
        "regionId": "gurgaon",
        "population": 78500,
        "areaKm2": 4.8,
        "centroid": [77.089, 28.498],
        "vulnerability": {
            "hvi": 0.82,
            "ndvi": 0.14,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 11.2,
            "childrenPercent": 8.9,
            "outdoorWorkersEstimate": 14500,
            "pavedSurfacePercent": 89
        },
        "currentMetrics": {
            "tempC": 33.6,
            "utci": 39.4,
            "wbgt": 28.4,
            "humidity": 62,
            "heatIndex": 40.2,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Establish hydration stations at Rapid Metro corridors",
            "Mandate shaded rest breaks for delivery fleet and security personnel"
        ]
    },
    {
        "id": "GUR-W-12",
        "code": "W-12",
        "name": "Badshahpur Labor Settlement",
        "zone": "Zone 11 - Gurgaon South East",
        "regionId": "gurgaon",
        "population": 57800,
        "areaKm2": 3.6,
        "centroid": [77.054, 28.398],
        "vulnerability": {
            "hvi": 0.89,
            "ndvi": 0.08,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 15.6,
            "childrenPercent": 16.4,
            "outdoorWorkersEstimate": 12800,
            "pavedSurfacePercent": 85
        },
        "currentMetrics": {
            "tempC": 34.0,
            "utci": 40.1,
            "wbgt": 28.9,
            "humidity": 64,
            "heatIndex": 41.2,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Immediate potable water tanker dispatch to labor basti",
            "Continuous triage with mobile heatstroke ambulance"
        ]
    },
    {
        "id": "GUR-W-13",
        "code": "W-13",
        "name": "Old Gurgaon Railway Road & Sadar Bazar",
        "zone": "Zone 10 - Old Gurgaon",
        "regionId": "gurgaon",
        "population": 68400,
        "areaKm2": 3.1,
        "centroid": [77.022, 28.468],
        "vulnerability": {
            "hvi": 0.84,
            "ndvi": 0.12,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 17.2,
            "childrenPercent": 13.0,
            "outdoorWorkersEstimate": 9800,
            "pavedSurfacePercent": 87
        },
        "currentMetrics": {
            "tempC": 33.7,
            "utci": 39.5,
            "wbgt": 28.5,
            "humidity": 63,
            "heatIndex": 40.3,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Deploy municipal potable cold water tanker near Sadar Bazar",
            "Open community air-cooled rest tent"
        ]
    }
]

SOHNA_WARDS = [
    {
        "id": "SOH-W-01",
        "code": "W-01",
        "name": "Sohna Town & Shiva Kund Heritage Zone",
        "zone": "Zone 15 - Sohna Municipal Sub-Division",
        "regionId": "sohna-gurgaon",
        "population": 51200,
        "areaKm2": 4.1,
        "centroid": [77.068, 28.248],
        "vulnerability": {
            "hvi": 0.82,
            "ndvi": 0.18,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 16.5,
            "childrenPercent": 14.2,
            "outdoorWorkersEstimate": 8600,
            "pavedSurfacePercent": 76
        },
        "currentMetrics": {
            "tempC": 33.9,
            "utci": 39.8,
            "wbgt": 28.7,
            "humidity": 63,
            "heatIndex": 40.6,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Establish chilled hydration kiosk at Sohna Bus Stand",
            "Equip Sohna Sub-Divisional Hospital with dedicated heat stroke beds"
        ]
    },
    {
        "id": "SOH-W-02",
        "code": "W-02",
        "name": "IMT Sohna Industrial Corridor",
        "zone": "Zone 16 - Sohna Industrial Township",
        "regionId": "sohna-gurgaon",
        "population": 46800,
        "areaKm2": 5.2,
        "centroid": [77.052, 28.232],
        "vulnerability": {
            "hvi": 0.86,
            "ndvi": 0.12,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 9.8,
            "childrenPercent": 11.5,
            "outdoorWorkersEstimate": 13200,
            "pavedSurfacePercent": 88
        },
        "currentMetrics": {
            "tempC": 34.3,
            "utci": 40.6,
            "wbgt": 29.2,
            "humidity": 62,
            "heatIndex": 41.4,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Mandate industrial shade shelters across manufacturing sheds",
            "Deploy emergency potable water bowser to labor colonies"
        ]
    }
]

MUMBAI_WARDS = [
    {
        "id": "BOM-W-01",
        "code": "W-01",
        "name": "Dharavi High Density Settlement",
        "zone": "G-North Ward - Dharavi",
        "regionId": "mumbai",
        "population": 124000,
        "areaKm2": 2.4,
        "centroid": [72.855, 19.043],
        "vulnerability": {
            "hvi": 0.94,
            "ndvi": 0.05,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 12.8,
            "childrenPercent": 18.2,
            "outdoorWorkersEstimate": 28000,
            "pavedSurfacePercent": 95
        },
        "currentMetrics": {
            "tempC": 31.8,
            "utci": 40.2,
            "wbgt": 29.8,
            "humidity": 82,
            "heatIndex": 42.1,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Deploy round-the-clock water tankers to 90 Feet Road",
            "Operate air-cooled community respite shelter at transit school",
            "Distribute oral rehydration salts to leather & pottery workers"
        ]
    },
    {
        "id": "BOM-W-02",
        "code": "W-02",
        "name": "Kurla West & LBS Road Transit Corridor",
        "zone": "L Ward - Kurla",
        "regionId": "mumbai",
        "population": 98500,
        "areaKm2": 3.5,
        "centroid": [72.882, 19.070],
        "vulnerability": {
            "hvi": 0.88,
            "ndvi": 0.08,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 14.5,
            "childrenPercent": 14.0,
            "outdoorWorkersEstimate": 16500,
            "pavedSurfacePercent": 91
        },
        "currentMetrics": {
            "tempC": 32.1,
            "utci": 40.8,
            "wbgt": 30.1,
            "humidity": 81,
            "heatIndex": 42.8,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Set up hydration points at Kurla suburban rail platforms",
            "Station BMC mobile medical emergency unit on LBS Marg"
        ]
    },
    {
        "id": "BOM-W-03",
        "code": "W-03",
        "name": "Colaba & Fort Heritage Financial District",
        "zone": "A Ward - South Mumbai",
        "regionId": "mumbai",
        "population": 52000,
        "areaKm2": 4.1,
        "centroid": [72.831, 18.928],
        "vulnerability": {
            "hvi": 0.62,
            "ndvi": 0.22,
            "informalSettlementDensity": "LOW",
            "elderlyPercent": 19.8,
            "childrenPercent": 8.2,
            "outdoorWorkersEstimate": 5400,
            "pavedSurfacePercent": 78
        },
        "currentMetrics": {
            "tempC": 31.0,
            "utci": 38.6,
            "wbgt": 28.9,
            "humidity": 83,
            "heatIndex": 40.5,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Maintain shaded canopies at Gateway of India tourist plaza",
            "Ensure air-conditioned municipal dispensaries remain accessible"
        ]
    }
]

AHMEDABAD_WARDS = [
    {
        "id": "AHM-W-01",
        "code": "W-01",
        "name": "Kalupur & Old Walled City Wholesale Hub",
        "zone": "Central Zone - Walled City",
        "regionId": "ahmedabad",
        "population": 84500,
        "areaKm2": 2.9,
        "centroid": [72.598, 23.028],
        "vulnerability": {
            "hvi": 0.92,
            "ndvi": 0.06,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 16.5,
            "childrenPercent": 13.8,
            "outdoorWorkersEstimate": 18200,
            "pavedSurfacePercent": 93
        },
        "currentMetrics": {
            "tempC": 35.5,
            "utci": 41.2,
            "wbgt": 29.5,
            "humidity": 58,
            "heatIndex": 42.4,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Activate AMC Cool Roof initiative and white-coating inspection",
            "Deploy water tankers to Kalupur wholesale textile alleys",
            "Stand by 108 heatstroke ambulance at Ahmedabad Railway Station"
        ]
    },
    {
        "id": "AHM-W-02",
        "code": "W-02",
        "name": "Naroda Mega Industrial Estate",
        "zone": "North Zone - Naroda GIDC",
        "regionId": "ahmedabad",
        "population": 91200,
        "areaKm2": 5.4,
        "centroid": [72.652, 23.078],
        "vulnerability": {
            "hvi": 0.89,
            "ndvi": 0.08,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 10.5,
            "childrenPercent": 12.0,
            "outdoorWorkersEstimate": 22400,
            "pavedSurfacePercent": 92
        },
        "currentMetrics": {
            "tempC": 36.2,
            "utci": 42.1,
            "wbgt": 29.9,
            "humidity": 55,
            "heatIndex": 43.1,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Mandate industrial shift rotations avoiding 12 PM - 3:30 PM",
            "Provide iced ORS drink dispensers at all factory gates"
        ]
    }
]

NAGPUR_WARDS = [
    {
        "id": "NAG-W-01",
        "code": "W-01",
        "name": "Sitabuldi Central Commercial & Interchange",
        "zone": "Dharampeth Zone - Nagpur Core",
        "regionId": "nagpur",
        "population": 62400,
        "areaKm2": 3.0,
        "centroid": [79.082, 21.146],
        "vulnerability": {
            "hvi": 0.88,
            "ndvi": 0.12,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 15.2,
            "childrenPercent": 11.5,
            "outdoorWorkersEstimate": 9800,
            "pavedSurfacePercent": 88
        },
        "currentMetrics": {
            "tempC": 34.8,
            "utci": 40.5,
            "wbgt": 28.9,
            "humidity": 60,
            "heatIndex": 41.8,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Deploy cold drinking water bowser at Sitabuldi Metro Station",
            "Operate misting tent at main bus interchange"
        ]
    },
    {
        "id": "NAG-W-02",
        "code": "W-02",
        "name": "MIDC Hingna Industrial Zone",
        "zone": "Laxmi Nagar Zone - West Nagpur",
        "regionId": "nagpur",
        "population": 78200,
        "areaKm2": 5.8,
        "centroid": [78.995, 21.108],
        "vulnerability": {
            "hvi": 0.86,
            "ndvi": 0.15,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 11.0,
            "childrenPercent": 12.5,
            "outdoorWorkersEstimate": 17500,
            "pavedSurfacePercent": 86
        },
        "currentMetrics": {
            "tempC": 35.2,
            "utci": 41.0,
            "wbgt": 29.2,
            "humidity": 59,
            "heatIndex": 42.3,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Ensure factories provide shaded rest zones with cool water",
            "Stage GMC Nagpur heatstroke response unit in Hingna"
        ]
    }
]

JAIPUR_WARDS = [
    {
        "id": "JAI-W-01",
        "code": "W-01",
        "name": "Johari Bazaar & Pink City Walled Quarter",
        "zone": "Heritage Zone - Jaipur Central",
        "regionId": "jaipur",
        "population": 76500,
        "areaKm2": 2.8,
        "centroid": [75.828, 26.921],
        "vulnerability": {
            "hvi": 0.90,
            "ndvi": 0.08,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 17.5,
            "childrenPercent": 13.0,
            "outdoorWorkersEstimate": 14200,
            "pavedSurfacePercent": 91
        },
        "currentMetrics": {
            "tempC": 35.0,
            "utci": 40.8,
            "wbgt": 28.7,
            "humidity": 54,
            "heatIndex": 41.5,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Deploy municipal water bowsers inside walled gates (Ajmeri Gate, Sanganeri Gate)",
            "Distribute ORS and caps to heritage rickshaw pullers"
        ]
    },
    {
        "id": "JAI-W-02",
        "code": "W-02",
        "name": "Sitapura Industrial Belt & RIICO",
        "zone": "Sanganer Zone - South Jaipur",
        "regionId": "jaipur",
        "population": 83400,
        "areaKm2": 5.6,
        "centroid": [75.815, 26.782],
        "vulnerability": {
            "hvi": 0.87,
            "ndvi": 0.10,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 9.5,
            "childrenPercent": 11.8,
            "outdoorWorkersEstimate": 19500,
            "pavedSurfacePercent": 89
        },
        "currentMetrics": {
            "tempC": 35.6,
            "utci": 41.5,
            "wbgt": 29.1,
            "humidity": 52,
            "heatIndex": 42.0,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Enforce labor curfew on outdoor construction between 12 PM and 4 PM",
            "Deploy SMS heat alerts to factory workers and contractors"
        ]
    }
]

PUNE_WARDS = [
    {
        "id": "PUN-W-01",
        "code": "W-01",
        "name": "Shivajinagar Transit & Institutional",
        "zone": "Shivajinagar - Ghole Road",
        "regionId": "pune",
        "population": 58900,
        "areaKm2": 3.5,
        "centroid": [73.851, 18.531],
        "vulnerability": {
            "hvi": 0.65,
            "ndvi": 0.28,
            "informalSettlementDensity": "MODERATE",
            "elderlyPercent": 16.5,
            "childrenPercent": 10.2,
            "outdoorWorkersEstimate": 6800,
            "pavedSurfacePercent": 75
        },
        "currentMetrics": {
            "tempC": 29.8,
            "utci": 35.5,
            "wbgt": 25.8,
            "humidity": 72,
            "heatIndex": 35.9,
            "riskLevel": "MODERATE"
        },
        "recommendedActions": [
            "Maintain shaded public waiting facilities at Shivajinagar ST Stand",
            "Ensure PMC water refill booths are fully stocked"
        ]
    },
    {
        "id": "PUN-W-02",
        "code": "W-02",
        "name": "Hadapsar Industrial & Labor Settlement",
        "zone": "Hadapsar - Mundhwa Zone",
        "regionId": "pune",
        "population": 84200,
        "areaKm2": 4.8,
        "centroid": [73.931, 18.502],
        "vulnerability": {
            "hvi": 0.78,
            "ndvi": 0.16,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 12.8,
            "childrenPercent": 13.5,
            "outdoorWorkersEstimate": 14200,
            "pavedSurfacePercent": 84
        },
        "currentMetrics": {
            "tempC": 30.5,
            "utci": 36.4,
            "wbgt": 26.4,
            "humidity": 70,
            "heatIndex": 36.8,
            "riskLevel": "MODERATE"
        },
        "recommendedActions": [
            "Deploy mobile water tankers across Hadapsar labor colonies",
            "Ensure PMC Yashwantrao Chavan Hospital maintains heatstroke protocol"
        ]
    }
]

# Combined Delhi-Gurgaon legacy view wards
DELHI_GURGAON_WARDS = [
    {
        "id": "DELGUR-W-01",
        "code": "W-01",
        "name": "Connaught Place & Rajiv Chowk Hub",
        "zone": "Zone 1 - Central Delhi",
        "regionId": "delhi-gurgaon",
        "population": 48500,
        "areaKm2": 3.2,
        "centroid": [77.218, 28.631],
        "vulnerability": {
            "hvi": 0.88,
            "ndvi": 0.12,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 18.5,
            "childrenPercent": 12.2,
            "outdoorWorkersEstimate": 8400,
            "pavedSurfacePercent": 82
        },
        "currentMetrics": {
            "tempC": 33.5,
            "utci": 39.2,
            "wbgt": 28.5,
            "humidity": 65,
            "heatIndex": 40.1,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Deploy emergency high-capacity water tanker to Rajiv Chowk radial",
            "Activate misting stations at bus terminals and Metro gates"
        ]
    },
    {
        "id": "DELGUR-W-11",
        "code": "W-11",
        "name": "DLF Cyber City & Udyog Vihar",
        "zone": "Zone 8 - Gurgaon North (Cyber Hub)",
        "regionId": "delhi-gurgaon",
        "population": 78500,
        "areaKm2": 4.8,
        "centroid": [77.089, 28.498],
        "vulnerability": {
            "hvi": 0.82,
            "ndvi": 0.14,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 11.2,
            "childrenPercent": 8.9,
            "outdoorWorkersEstimate": 14500,
            "pavedSurfacePercent": 89
        },
        "currentMetrics": {
            "tempC": 33.6,
            "utci": 39.4,
            "wbgt": 28.4,
            "humidity": 62,
            "heatIndex": 40.2,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Establish hydration stations at Rapid Metro corridors",
            "Enforce labor curfew on high-rise construction towers"
        ]
    },
    {
        "id": "DELGUR-W-12",
        "code": "W-12",
        "name": "Badshahpur Labor Settlement",
        "zone": "Zone 11 - Gurgaon South East",
        "regionId": "delhi-gurgaon",
        "population": 57800,
        "areaKm2": 3.6,
        "centroid": [77.054, 28.398],
        "vulnerability": {
            "hvi": 0.89,
            "ndvi": 0.08,
            "informalSettlementDensity": "HIGH",
            "elderlyPercent": 15.6,
            "childrenPercent": 16.4,
            "outdoorWorkersEstimate": 12800,
            "pavedSurfacePercent": 85
        },
        "currentMetrics": {
            "tempC": 34.0,
            "utci": 40.1,
            "wbgt": 28.9,
            "humidity": 64,
            "heatIndex": 41.2,
            "riskLevel": "HIGH"
        },
        "recommendedActions": [
            "Immediate potable water tanker dispatch to labor basti",
            "Continuous triage with mobile heatstroke ambulance"
        ]
    }
]

DEFAULT_RESOURCES = [
    # GUWAHATI
    {
        "id": "AMB-108-GUW",
        "name": "Guwahati Emergency Heatstroke Mobile ICU 01",
        "type": "AMBULANCE",
        "wardId": "GUW-W-01",
        "wardName": "Fancy Bazar Wholesale & Commercial",
        "zone": "Zone 1 - Riverfront Market",
        "regionId": "guwahati",
        "coordinates": [91.742, 26.185],
        "status": "AVAILABLE",
        "capacity": 2,
        "capacityUnit": "beds",
        "coverageEstimate": 14000,
        "priority": "HIGH",
        "reason": "Rapid triage for dehydration & heat collapse in dense commercial market",
        "contactNumber": "+91-108",
        "vehicleNumber": "AS-01-AMB-1081",
        "equipment": ["Ice Immersion Bath", "IV Fluid Chiller", "Portable Oxygen", "Cardiac Monitor"],
        "etaMinutes": 5,
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "WT-8000-GUW",
        "name": "Guwahati Municipal Cold Potable Bowser 01",
        "type": "WATER_TANKER",
        "wardId": "GUW-W-02",
        "wardName": "Paltan Bazaar & Railway Terminus",
        "zone": "Zone 1 - Central Transit",
        "regionId": "guwahati",
        "coordinates": [91.753, 26.180],
        "status": "AVAILABLE",
        "capacity": 8000,
        "capacityUnit": "liters",
        "coverageEstimate": 12000,
        "priority": "HIGH",
        "reason": "Free chilled hydration for arriving rail passengers and daily wage porters",
        "contactNumber": "+91-1800-345-3611",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "HOSP-GMCH-01",
        "name": "Gauhati Medical College & Hospital (GMCH) Apex Heatstroke Unit",
        "type": "HOSPITAL",
        "wardId": "GUW-W-06",
        "wardName": "Bhangagarh & GMCH Medical Corridor",
        "zone": "Zone 3 - Central Health",
        "regionId": "guwahati",
        "coordinates": [91.769, 26.159],
        "status": "AVAILABLE",
        "capacity": 50,
        "capacityUnit": "beds",
        "availableBeds": 38,
        "icuBeds": 12,
        "coverageEstimate": 45000,
        "priority": "SEVERE",
        "reason": "Apex tertiary trauma & heatstroke hyperthermia cooling center",
        "contactNumber": "+91-361-2529457",
        "hospitalTier": "APEX_TRAUMA",
        "equipment": ["Central AC Chiller Ward", "Cold Saline Infusion", "Core Body Thermometry"],
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "COOL-DISPUR-01",
        "name": "Dispur Municipal Air-Cooled Refuge Shelter 01",
        "type": "COOLING_CENTER",
        "wardId": "GUW-W-04",
        "wardName": "Dispur Secretariat & Capital Complex",
        "zone": "Zone 2 - Dispur Capital Center",
        "regionId": "guwahati",
        "coordinates": [91.792, 26.144],
        "status": "AVAILABLE",
        "capacity": 250,
        "capacityUnit": "people",
        "coverageEstimate": 8500,
        "priority": "MODERATE",
        "reason": "Public air-conditioned respite space with electrolyte water dispensers",
        "contactNumber": "+91-1800-345-1234",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },

    # DELHI
    {
        "id": "AMB-108-DEL-01",
        "name": "Delhi CATS Rapid Heat Emergency Mobile ICU 01",
        "type": "AMBULANCE",
        "wardId": "DEL-W-01",
        "wardName": "Connaught Place & Rajiv Chowk Hub",
        "zone": "Zone 1 - Central Delhi",
        "regionId": "delhi",
        "coordinates": [77.219, 28.632],
        "status": "AVAILABLE",
        "capacity": 2,
        "capacityUnit": "beds",
        "coverageEstimate": 15000,
        "priority": "HIGH",
        "reason": "Emergency stabilization and rapid triage for heatstroke in Central Delhi",
        "contactNumber": "+91-102",
        "vehicleNumber": "DL-01-CATS-1021",
        "equipment": ["Ice Immersion Tub", "IV Saline Chiller", "Multi-parameter Monitor"],
        "etaMinutes": 4,
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "WT-10000-DEL-01",
        "name": "Delhi Jal Board Emergency Chilled Bowser Alpha",
        "type": "WATER_TANKER",
        "wardId": "DEL-W-02",
        "wardName": "Chandni Chowk Wholesale Hub",
        "zone": "Zone 1 - North Central",
        "regionId": "delhi",
        "coordinates": [77.231, 28.657],
        "status": "AVAILABLE",
        "capacity": 10000,
        "capacityUnit": "liters",
        "coverageEstimate": 16000,
        "priority": "HIGH",
        "reason": "Chilled drinking water distribution in dense commercial lanes",
        "contactNumber": "+91-1800-11-7118",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "HOSP-LNJP-01",
        "name": "Lok Nayak Jai Prakash (LNJP) Apex Heatstroke Ward",
        "type": "HOSPITAL",
        "wardId": "DEL-W-01",
        "wardName": "Connaught Place Core",
        "zone": "Central Health Zone",
        "regionId": "delhi",
        "coordinates": [77.240, 28.638],
        "status": "AVAILABLE",
        "capacity": 60,
        "capacityUnit": "beds",
        "availableBeds": 42,
        "icuBeds": 16,
        "coverageEstimate": 60000,
        "priority": "SEVERE",
        "reason": "Apex heatstroke hyperthermia ICU with specialized evaporative cooling beds",
        "contactNumber": "+91-11-23233000",
        "hospitalTier": "APEX_TRAUMA",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },

    # GURGAON
    {
        "id": "AMB-108-GUR-01",
        "name": "NDMA Critical Care Heatstroke Ambulance HR-26",
        "type": "AMBULANCE",
        "wardId": "GUR-W-12",
        "wardName": "Badshahpur Labor Settlement",
        "zone": "South Sector Corridor",
        "regionId": "gurgaon",
        "coordinates": [77.054, 28.398],
        "status": "AVAILABLE",
        "capacity": 2,
        "capacityUnit": "beds",
        "coverageEstimate": 12000,
        "priority": "SEVERE",
        "reason": "Fast deployment for heat stroke resuscitation near labor colonies",
        "contactNumber": "+91-108",
        "vehicleNumber": "HR-26-NDMA-1081",
        "equipment": ["Ice Immersion Bath", "IV Fluid Chiller", "Cardiac Monitor", "Portable Oxygen"],
        "etaMinutes": 4,
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "WT-5000-GUR-01",
        "name": "Gurugram Municipal Potable Cold Bowser 01",
        "type": "WATER_TANKER",
        "wardId": "GUR-W-12",
        "wardName": "Badshahpur Labor Settlement",
        "zone": "South Sector Corridor",
        "regionId": "gurgaon",
        "coordinates": [77.062, 28.405],
        "status": "AVAILABLE",
        "capacity": 8000,
        "capacityUnit": "liters",
        "coverageEstimate": 8500,
        "priority": "HIGH",
        "reason": "Immediate rehydration point for high-density informal dwellings",
        "contactNumber": "+91-1800-180-2026",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "HOSP-GUR-CIVIL",
        "name": "Gurugram Civil Hospital Apex Heat Relief Wing",
        "type": "HOSPITAL",
        "wardId": "GUR-W-13",
        "wardName": "Old Gurgaon Railway Road",
        "zone": "Central Health Zone",
        "regionId": "gurgaon",
        "coordinates": [77.032, 28.462],
        "status": "AVAILABLE",
        "capacity": 40,
        "capacityUnit": "beds",
        "availableBeds": 28,
        "icuBeds": 8,
        "coverageEstimate": 35000,
        "priority": "SEVERE",
        "reason": "Civil hospital equipped with specialized cold saline infusion units",
        "contactNumber": "+91-124-2320102",
        "hospitalTier": "DISTRICT_HOSPITAL",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "COOL-GUR-01",
        "name": "Cyber City AC Community Cooling Refuge",
        "type": "COOLING_CENTER",
        "wardId": "GUR-W-11",
        "wardName": "DLF Cyber City & Udyog Vihar",
        "zone": "North Transit Zone",
        "regionId": "gurgaon",
        "coordinates": [77.085, 28.495],
        "status": "AVAILABLE",
        "capacity": 300,
        "capacityUnit": "people",
        "coverageEstimate": 15000,
        "priority": "HIGH",
        "reason": "Air conditioned refuge shelter for street vendors and delivery fleet",
        "contactNumber": "+91-1800-11-1078",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },

    # SOHNA
    {
        "id": "AMB-SOH-01",
        "name": "Sohna Sub-Divisional Heatstroke Ambulance 01",
        "type": "AMBULANCE",
        "wardId": "SOH-W-01",
        "wardName": "Sohna Town & Shiva Kund",
        "zone": "Zone 15 - Sohna",
        "regionId": "sohna-gurgaon",
        "coordinates": [77.069, 28.249],
        "status": "AVAILABLE",
        "capacity": 2,
        "capacityUnit": "beds",
        "coverageEstimate": 8000,
        "priority": "HIGH",
        "reason": "Rapid ambulance response across Sohna foothills and rural labor belts",
        "contactNumber": "+91-108",
        "vehicleNumber": "HR-26-SOH-108",
        "etaMinutes": 6,
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "WT-SOH-01",
        "name": "Sohna Municipal Potable Tanker 01",
        "type": "WATER_TANKER",
        "wardId": "SOH-W-02",
        "wardName": "IMT Sohna Industrial Corridor",
        "zone": "Zone 16 - Sohna",
        "regionId": "sohna-gurgaon",
        "coordinates": [77.053, 28.233],
        "status": "AVAILABLE",
        "capacity": 9000,
        "capacityUnit": "liters",
        "coverageEstimate": 9500,
        "priority": "HIGH",
        "reason": "Chilled drinking water supply to industrial sheds and construction labor",
        "contactNumber": "+91-1800-180-2026",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },

    # MUMBAI
    {
        "id": "AMB-108-BOM-01",
        "name": "BMC Emergency Heatstroke Mobile Unit 01",
        "type": "AMBULANCE",
        "wardId": "BOM-W-01",
        "wardName": "Dharavi High Density Settlement",
        "zone": "G-North Ward - Dharavi",
        "regionId": "mumbai",
        "coordinates": [72.856, 19.044],
        "status": "AVAILABLE",
        "capacity": 2,
        "capacityUnit": "beds",
        "coverageEstimate": 25000,
        "priority": "SEVERE",
        "reason": "Rapid hyperthermia cooling for dense informal housing workers",
        "contactNumber": "+91-108",
        "vehicleNumber": "MH-01-BMC-1081",
        "equipment": ["Ice Immersion Bath", "Cold IV Infusion", "Cardiac Monitor"],
        "etaMinutes": 4,
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "HOSP-KEM-01",
        "name": "KEM Hospital Apex Heat & Trauma Referral Center",
        "type": "HOSPITAL",
        "wardId": "BOM-W-01",
        "wardName": "Dharavi / Parel Health Zone",
        "zone": "Central Mumbai Health",
        "regionId": "mumbai",
        "coordinates": [72.842, 19.003],
        "status": "AVAILABLE",
        "capacity": 65,
        "capacityUnit": "beds",
        "availableBeds": 45,
        "icuBeds": 18,
        "coverageEstimate": 80000,
        "priority": "SEVERE",
        "reason": "Apex tertiary care hospital with 24x7 hyperthermia resuscitation ward",
        "contactNumber": "+91-22-24107000",
        "hospitalTier": "APEX_TRAUMA",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "WT-10000-BOM-01",
        "name": "Brihanmumbai Potable Water Tanker 01",
        "type": "WATER_TANKER",
        "wardId": "BOM-W-02",
        "wardName": "Kurla West & LBS Road",
        "zone": "L Ward - Kurla",
        "regionId": "mumbai",
        "coordinates": [72.883, 19.071],
        "status": "AVAILABLE",
        "capacity": 10000,
        "capacityUnit": "liters",
        "coverageEstimate": 18000,
        "priority": "HIGH",
        "reason": "Clean chilled drinking water distribution along Kurla transit junctions",
        "contactNumber": "+91-1916",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },

    # AHMEDABAD
    {
        "id": "AMB-108-AHM-01",
        "name": "Ahmedabad 108 Emergency Heatwave Ambulance",
        "type": "AMBULANCE",
        "wardId": "AHM-W-01",
        "wardName": "Kalupur Wholesale Hub",
        "zone": "Central Zone",
        "regionId": "ahmedabad",
        "coordinates": [72.599, 23.029],
        "status": "AVAILABLE",
        "capacity": 2,
        "capacityUnit": "beds",
        "coverageEstimate": 18000,
        "priority": "HIGH",
        "reason": "Fast heat exhaustion triage in walled city bazaars",
        "contactNumber": "+91-108",
        "vehicleNumber": "GJ-01-HAP-108",
        "equipment": ["Ice Immersion", "Cold Saline Chiller", "Portable O2"],
        "etaMinutes": 5,
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "HOSP-CIVIL-AHM",
        "name": "Ahmedabad Civil Hospital Apex Heat Action Wing",
        "type": "HOSPITAL",
        "wardId": "AHM-W-01",
        "wardName": "Kalupur / Asarwa Health Hub",
        "zone": "Central Zone",
        "regionId": "ahmedabad",
        "coordinates": [72.605, 23.053],
        "status": "AVAILABLE",
        "capacity": 80,
        "capacityUnit": "beds",
        "availableBeds": 56,
        "icuBeds": 22,
        "coverageEstimate": 90000,
        "priority": "SEVERE",
        "reason": "Pioneer Heat Action Plan facility with specialized cooling wards",
        "contactNumber": "+91-79-22683721",
        "hospitalTier": "APEX_TRAUMA",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "WT-10000-AHM-01",
        "name": "AMC Chilled Potable Bowser 01",
        "type": "WATER_TANKER",
        "wardId": "AHM-W-02",
        "wardName": "Naroda Mega Industrial Estate",
        "zone": "North Zone - Naroda",
        "regionId": "ahmedabad",
        "coordinates": [72.653, 23.079],
        "status": "AVAILABLE",
        "capacity": 12000,
        "capacityUnit": "liters",
        "coverageEstimate": 22000,
        "priority": "HIGH",
        "reason": "Chilled drinking water supply to GIDC factory shift workers",
        "contactNumber": "+91-155303",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },

    # NAGPUR
    {
        "id": "AMB-108-NAG-01",
        "name": "Nagpur NMC Heatstroke Emergency Ambulance",
        "type": "AMBULANCE",
        "wardId": "NAG-W-01",
        "wardName": "Sitabuldi Commercial Interchange",
        "zone": "Dharampeth Zone",
        "regionId": "nagpur",
        "coordinates": [79.083, 21.147],
        "status": "AVAILABLE",
        "capacity": 2,
        "capacityUnit": "beds",
        "coverageEstimate": 14000,
        "priority": "HIGH",
        "reason": "Rapid triage in Central Nagpur transit intersection",
        "contactNumber": "+91-108",
        "vehicleNumber": "MH-31-NMC-108",
        "etaMinutes": 4,
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "HOSP-GMC-NAG",
        "name": "Government Medical College (GMC) Nagpur Heat Unit",
        "type": "HOSPITAL",
        "wardId": "NAG-W-01",
        "wardName": "Sitabuldi / Medical College",
        "zone": "Central Health Zone",
        "regionId": "nagpur",
        "coordinates": [79.096, 21.127],
        "status": "AVAILABLE",
        "capacity": 50,
        "capacityUnit": "beds",
        "availableBeds": 34,
        "icuBeds": 12,
        "coverageEstimate": 50000,
        "priority": "SEVERE",
        "reason": "Vidarbha regional apex cooling trauma center",
        "contactNumber": "+91-712-2744671",
        "hospitalTier": "APEX_TRAUMA",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },

    # JAIPUR
    {
        "id": "AMB-108-JAI-01",
        "name": "Jaipur Greater Municipal Emergency Ambulance 01",
        "type": "AMBULANCE",
        "wardId": "JAI-W-01",
        "wardName": "Johari Bazaar Walled City",
        "zone": "Heritage Zone",
        "regionId": "jaipur",
        "coordinates": [75.829, 26.922],
        "status": "AVAILABLE",
        "capacity": 2,
        "capacityUnit": "beds",
        "coverageEstimate": 15000,
        "priority": "HIGH",
        "reason": "Rapid resuscitation unit deployed at tourist and artisan hub",
        "contactNumber": "+91-108",
        "vehicleNumber": "RJ-14-AMB-108",
        "etaMinutes": 5,
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "HOSP-SMS-JAI",
        "name": "SMS Hospital Apex Heatstroke Care Center",
        "type": "HOSPITAL",
        "wardId": "JAI-W-01",
        "wardName": "Johari Bazaar / SMS Hub",
        "zone": "Central Health Zone",
        "regionId": "jaipur",
        "coordinates": [75.818, 26.892],
        "status": "AVAILABLE",
        "capacity": 70,
        "capacityUnit": "beds",
        "availableBeds": 48,
        "icuBeds": 18,
        "coverageEstimate": 75000,
        "priority": "SEVERE",
        "reason": "Rajasthan apex tertiary hospital with designated air-chilled heat ICU",
        "contactNumber": "+91-141-2560291",
        "hospitalTier": "APEX_TRAUMA",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },

    # PUNE
    {
        "id": "AMB-108-PUN-01",
        "name": "Pune PMC Emergency Health Unit 01",
        "type": "AMBULANCE",
        "wardId": "PUN-W-01",
        "wardName": "Shivajinagar Transit Hub",
        "zone": "Shivajinagar Zone",
        "regionId": "pune",
        "coordinates": [73.852, 18.532],
        "status": "AVAILABLE",
        "capacity": 2,
        "capacityUnit": "beds",
        "coverageEstimate": 12000,
        "priority": "MODERATE",
        "reason": "Rapid triage in Shivajinagar railway and bus concourse",
        "contactNumber": "+91-108",
        "vehicleNumber": "MH-12-PMC-108",
        "etaMinutes": 5,
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "HOSP-SASS-PUN",
        "name": "Sassoon General Hospital Heat Relief Wing",
        "type": "HOSPITAL",
        "wardId": "PUN-W-01",
        "wardName": "Shivajinagar / Station Concourse",
        "zone": "Central Health Zone",
        "regionId": "pune",
        "coordinates": [73.874, 18.526],
        "status": "AVAILABLE",
        "capacity": 45,
        "capacityUnit": "beds",
        "availableBeds": 31,
        "icuBeds": 10,
        "coverageEstimate": 45000,
        "priority": "HIGH",
        "reason": "Pune district referral hospital for heat exhaustion and dehydration",
        "contactNumber": "+91-20-26128000",
        "hospitalTier": "DISTRICT_HOSPITAL",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },

    # DELHI-GURGAON (NCR)
    {
        "id": "AMB-108-01",
        "name": "NDMA Critical Care Heatstroke Ambulance 01",
        "type": "AMBULANCE",
        "wardId": "DELGUR-W-12",
        "wardName": "Badshahpur Labor Settlement",
        "zone": "South Sector Corridor",
        "regionId": "delhi-gurgaon",
        "coordinates": [77.054, 28.398],
        "status": "AVAILABLE",
        "capacity": 2,
        "capacityUnit": "beds",
        "coverageEstimate": 12000,
        "priority": "SEVERE",
        "reason": "Fast deployment for heat stroke resuscitation near labor colonies",
        "contactNumber": "+91-108",
        "vehicleNumber": "HR-26-NDMA-1081",
        "equipment": ["Ice Immersion Bath", "IV Fluid Chiller", "Cardiac Monitor", "Portable Oxygen"],
        "etaMinutes": 4,
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "WT-5000-02",
        "name": "Municipal Potable Cold Water Tanker Alpha",
        "type": "WATER_TANKER",
        "wardId": "DELGUR-W-12",
        "wardName": "Badshahpur Labor Settlement",
        "zone": "South Sector Corridor",
        "regionId": "delhi-gurgaon",
        "coordinates": [77.062, 28.405],
        "status": "AVAILABLE",
        "capacity": 8000,
        "capacityUnit": "liters",
        "coverageEstimate": 8500,
        "priority": "SEVERE",
        "reason": "Immediate rehydration point for high-density informal dwellings",
        "contactNumber": "+91-1800-180-2026",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "HOSP-TRAUMA-01",
        "name": "Gurugram Civil Hospital Apex Heat Relief Wing",
        "type": "HOSPITAL",
        "wardId": "DELGUR-W-01",
        "wardName": "Connaught Place Hub",
        "zone": "Central Health Zone",
        "regionId": "delhi-gurgaon",
        "coordinates": [77.032, 28.462],
        "status": "AVAILABLE",
        "capacity": 40,
        "capacityUnit": "beds",
        "availableBeds": 28,
        "icuBeds": 8,
        "coverageEstimate": 35000,
        "priority": "SEVERE",
        "reason": "Civil hospital equipped with specialized cold saline infusion units",
        "contactNumber": "+91-124-2320102",
        "hospitalTier": "DISTRICT_HOSPITAL",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "COOL-SHELTER-03",
        "name": "NDMA AC Community Cooling Refuge Center 03",
        "type": "COOLING_CENTER",
        "wardId": "DELGUR-W-11",
        "wardName": "DLF Cyber City & Udyog Vihar",
        "zone": "North Transit Zone",
        "regionId": "delhi-gurgaon",
        "coordinates": [77.085, 28.495],
        "status": "AVAILABLE",
        "capacity": 300,
        "capacityUnit": "people",
        "coverageEstimate": 15000,
        "priority": "HIGH",
        "reason": "Air conditioned refuge shelter for street vendors and delivery fleet",
        "contactNumber": "+91-1800-11-1078",
        "lastUpdated": datetime.now(timezone.utc).isoformat()
    }
]

DEFAULT_ALERTS = [
    {
        "id": "alert-guw-01",
        "wardId": "GUW-W-01",
        "wardName": "Fancy Bazar Wholesale & Commercial",
        "zone": "Zone 1 - Riverfront Market",
        "regionId": "guwahati",
        "severity": "MODERATE",
        "riskLevel": "MODERATE",
        "title": "Seasonal Thermal Comfort & Hydration Advisory: UTCI 35.8°C",
        "consecutiveHours": 4,
        "utci": 35.8,
        "wbgt": 26.8,
        "tempC": 29.5,
        "description": "Relative humidity elevated in Fancy Bazar. Ambient temperature is within seasonal baseline. Ensure hydration points remain active.",
        "recommendedActions": [
            "Maintain drinking water stations at Fancy Bazar market square",
            "Keep misting cooling booth active during peak afternoon humidity",
            "Routine monitoring of outdoor laborers and street vendors"
        ],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "ACTIVE",
        "channels": ["TELEGRAM", "SMS", "MUNICIPAL_BROADCAST"]
    },
    {
        "id": "alert-del-01",
        "wardId": "DEL-W-01",
        "wardName": "Connaught Place & Rajiv Chowk Hub",
        "zone": "Zone 1 - Central Delhi",
        "regionId": "delhi",
        "severity": "HIGH",
        "riskLevel": "HIGH",
        "title": "High Thermal Stress Advisory: Central Delhi Transit Hub",
        "consecutiveHours": 4,
        "utci": 39.2,
        "wbgt": 28.5,
        "tempC": 33.5,
        "description": "Urban heat island effect causing high surface temperatures on Rajiv Chowk radial roads and metro plazas.",
        "recommendedActions": [
            "Operate misting canopies at transit bus stations and Metro gates",
            "Ensure regular hydration breaks for outdoor workers and traffic police"
        ],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "ACTIVE",
        "channels": ["TELEGRAM", "SMS", "MUNICIPAL_BROADCAST"]
    },
    {
        "id": "alert-gur-01",
        "wardId": "GUR-W-11",
        "wardName": "DLF Cyber City & Udyog Vihar",
        "zone": "Zone 8 - Gurgaon North",
        "regionId": "gurgaon",
        "severity": "HIGH",
        "riskLevel": "HIGH",
        "title": "High Thermal Stress Advisory for Delivery & Industrial Sectors",
        "consecutiveHours": 4,
        "utci": 39.4,
        "wbgt": 28.4,
        "tempC": 33.6,
        "description": "Urban Heat Island effect causing elevated surface temperatures on Cyber City glass facades and asphalt roads.",
        "recommendedActions": [
            "Mandate air-conditioned rest breaks for food delivery partners",
            "Operate misting canopies at Cyber Hub pedestrian plazas"
        ],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "ACTIVE",
        "channels": ["TELEGRAM", "WEB_PUSH"]
    },
    {
        "id": "alert-bom-01",
        "wardId": "BOM-W-01",
        "wardName": "Dharavi High Density Settlement",
        "zone": "G-North Ward - Dharavi",
        "regionId": "mumbai",
        "severity": "HIGH",
        "riskLevel": "HIGH",
        "title": "High Coastal Humidity & Thermal Stress Warning",
        "consecutiveHours": 5,
        "utci": 40.2,
        "wbgt": 29.8,
        "tempC": 31.8,
        "description": "High ambient humidity (82%) restricts natural cooling in dense informal settlements. Rapid hydration deployment required.",
        "recommendedActions": [
            "Continuous potable water distribution across Dharavi 90 Feet Road",
            "Keep BMC cooling shelters open with electrolyte supplies"
        ],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "ACTIVE",
        "channels": ["TELEGRAM", "SMS", "MUNICIPAL_BROADCAST"]
    },
    {
        "id": "alert-ahm-01",
        "wardId": "AHM-W-01",
        "wardName": "Kalupur Wholesale Market Hub",
        "zone": "Central Zone",
        "regionId": "ahmedabad",
        "severity": "HIGH",
        "riskLevel": "HIGH",
        "title": "Ahmedabad Heat Action Plan Phase II Alert",
        "consecutiveHours": 4,
        "utci": 41.2,
        "wbgt": 29.5,
        "tempC": 35.5,
        "description": "Elevated afternoon thermal stress in historic walled city. Free water booths and shade shelters activated.",
        "recommendedActions": [
            "Deploy AMC mobile water bowsers to Kalupur textile markets",
            "Put 108 heat ambulances on high alert"
        ],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "ACTIVE",
        "channels": ["TELEGRAM", "SMS", "MUNICIPAL_BROADCAST"]
    }
]

async def seed_database(force: bool = False):
    """
    Seeds wards, resources, and alerts into MongoDB with complete upsert
    guaranteeing all major municipal regions have data.
    """
    try:
        db = get_database()
        
        # 1. Seed Wards
        all_wards = (
            GUWAHATI_WARDS +
            DELHI_WARDS +
            GURGAON_WARDS +
            SOHNA_WARDS +
            MUMBAI_WARDS +
            AHMEDABAD_WARDS +
            NAGPUR_WARDS +
            JAIPUR_WARDS +
            PUNE_WARDS +
            DELHI_GURGAON_WARDS
        )
        for w in all_wards:
            await db.wards.update_one({"id": w["id"]}, {"$set": w}, upsert=True)
        print(f"[Seed] Wards collection synced ({len(all_wards)} wards across {10} regions)")

        # 2. Seed Resources
        for r in DEFAULT_RESOURCES:
            await db.resources.update_one({"id": r["id"]}, {"$set": r}, upsert=True)
        print(f"[Seed] Resources collection synced ({len(DEFAULT_RESOURCES)} items)")

        # 3. Seed Alerts
        for a in DEFAULT_ALERTS:
            await db.alerts.update_one({"id": a["id"]}, {"$set": a}, upsert=True)
        print(f"[Seed] Alerts collection synced ({len(DEFAULT_ALERTS)} alerts)")

        return True
    except Exception as e:
        print(f"[Seed Warning]: {e}")
        return False
