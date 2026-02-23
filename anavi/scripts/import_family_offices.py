#!/usr/bin/env python3
"""
Script to parse family office data and generate SQL insert statements
"""

import json
import re
from datetime import datetime

# Family offices data from multiple sources
family_offices_data = [
    # From FundingStack list
    {"name": "10Branch", "city": "Portland", "state": "Oregon", "description": "Combines capital with operationally proven approach to help companies find deliberate growth", "contact_name": "Jay Haladay", "contact_title": "Partner", "contact_email": "jay@10branch.com", "type": "single_family", "investment_focus": ["growth_equity", "operations"]},
    {"name": "39 North Capital", "city": "New York", "state": "New York", "description": "Invests capital on behalf of Eastbridge Group", "aum": 1500000000, "contact_name": "Wayne Bell", "contact_title": "Operating Partner", "contact_email": "wbell@bellinvestmentpartners.com", "type": "single_family", "investment_focus": ["diversified", "real_estate"]},
    {"name": "A2B Ventures", "city": "New York", "state": "New York", "description": "Founded by Ari Bloom, focused on consumer brands in fashion", "contact_name": "Richard Rumpel", "contact_title": "National Sales Consultant", "contact_email": "richard@a2bventures.com", "type": "single_family", "investment_focus": ["consumer", "fashion", "retail"]},
    {"name": "Acuitas Investments", "city": "Seattle", "state": "Washington", "description": "US-based family office", "contact_name": "Dennis Jensen", "contact_title": "Partner, Director of Research", "contact_email": "djensen@acuitasinvestments.com", "type": "single_family", "investment_focus": ["diversified"]},
    {"name": "Adit Ventures", "city": "New York", "state": "New York", "description": "Invests in entrepreneurs and investment managers", "contact_name": "Eric Lazear", "contact_title": "Chief Operating Officer", "contact_email": "lazear@adit.vc", "type": "single_family", "investment_focus": ["venture_capital", "fund_of_funds"]},
    {"name": "Alinda Capital Partners", "city": "Greenwich", "state": "Connecticut", "description": "One of the world's largest infrastructure investment firms", "contact_name": "Simon Riggall", "contact_title": "Partner", "contact_email": "simon.riggall@alinda.com", "type": "single_family", "investment_focus": ["infrastructure"]},
    {"name": "Alpha Square Group", "city": "New York", "state": "New York", "description": "Invests in growth-stage private companies across TMT, Healthcare, and Real Estate", "contact_name": "Renee Li", "contact_title": "Chief Executive Officer", "contact_email": "renee.li@alphasquaregroup.com", "type": "single_family", "investment_focus": ["technology", "healthcare", "real_estate"]},
    {"name": "Ark Applications", "city": "Lutz", "state": "Florida", "description": "Private equity and consulting firm", "contact_name": "Daniel Greco", "contact_title": "CEO & Managing Partner", "contact_email": "dan.greco@arkapps.com", "type": "single_family", "investment_focus": ["private_equity", "consulting"]},
    {"name": "August Spark", "city": "New Rochelle", "state": "New York", "description": "New York-based family office", "contact_name": "Michael Cassidy", "contact_title": "Partner", "contact_email": "michael@augustspark.com", "type": "single_family", "investment_focus": ["diversified"]},
    {"name": "Avista Investments", "city": "Monrovia", "state": "California", "description": "Specializes in private venture investments", "contact_name": "Ashley Feng", "contact_title": "Executive Assistant", "contact_email": "ashley@cosmofiber.com", "type": "single_family", "investment_focus": ["venture_capital"]},
    {"name": "Beamonte Investments", "city": "Boston", "state": "Massachusetts", "description": "Single Family Office delivering consistent long-term returns", "contact_name": "Luis Trevino", "contact_title": "Senior Managing Director", "contact_email": "luis.trevino@beamonte.com", "type": "single_family", "investment_focus": ["long_term", "diversified"]},
    {"name": "Bodley Group", "city": "St. Louis", "state": "Missouri", "description": "Venture capital firm investing in seed and growth-stage technology", "contact_name": "Dave Clark", "contact_title": "President & Chief Creative Officer", "contact_email": "dave@bodleygroup.com", "type": "single_family", "investment_focus": ["venture_capital", "technology"]},
    {"name": "Bohemian Companies", "city": "Fort Collins", "state": "Colorado", "description": "Private family foundation supporting community building", "contact_name": "Stephanie McCoy", "contact_title": "COO and CFO", "contact_email": "stephanie@bohemiancompanies.com", "type": "single_family", "investment_focus": ["impact", "community"]},
    {"name": "BSL Capital", "city": "New York", "state": "New York", "description": "Private investment office of Bennett S. LeBow and family", "contact_name": "Lars Lerner", "contact_title": "President", "contact_email": "bmg3500@aol.com", "type": "single_family", "investment_focus": ["diversified"]},
    {"name": "Capricorn Investment Group", "city": "Palo Alto", "state": "California", "description": "Invests profitably while driving sustainable positive change", "contact_name": "Ion Yadigaroglu", "contact_title": "Partner", "contact_email": "iyadigaroglu@capricornllc.com", "type": "single_family", "investment_focus": ["sustainable", "impact", "technology"]},
    {"name": "Cascade Investment", "city": "Colorado Springs", "state": "Colorado", "description": "Investment professionals with over 100 years combined experience", "contact_name": "Nathan Doctor", "contact_title": "Investment Analyst", "contact_email": "nathan_doctor@cascadeassetmanagement.com", "type": "single_family", "investment_focus": ["diversified"]},
    {"name": "Cedar Hill Holdings", "city": "New York", "state": "New York", "description": "Private investment firm focused on commercial real estate and venture", "contact_name": "Roger Saunders", "contact_title": "Managing Partner", "contact_email": "roger.saunders@cedarhillholdings.com", "type": "single_family", "investment_focus": ["real_estate", "venture_capital"]},
    {"name": "Chaifetz Group", "city": "Chicago", "state": "Illinois", "description": "Venture capital and private equity firm specializing in early and mid-stage growth", "contact_name": "Ryan Brown", "contact_title": "Vice President", "contact_email": "ryanjbrown4@gmail.com", "type": "single_family", "investment_focus": ["venture_capital", "private_equity", "growth"]},
    {"name": "Charterhouse Strategic Partners", "city": "Summit", "state": "New Jersey", "description": "Private Equity executives with over 30 years experience managing $2B+", "contact_name": "Tom Dircks", "contact_title": "Managing Director", "type": "single_family", "investment_focus": ["private_equity"]},
    {"name": "Emerson Collective", "city": "Palo Alto", "state": "California", "description": "Laurene Powell Jobs' organization focused on education, immigration, environment", "founding_family": "Jobs/Powell Jobs", "wealth_source": "Apple", "aum": 3500000000, "type": "single_family", "investment_focus": ["impact", "education", "environment", "media"]},
    
    # From SWFI Rankings - Major US Family Offices
    {"name": "Walton Enterprises", "city": "Bentonville", "state": "Arkansas", "founding_family": "Walton", "wealth_source": "Walmart", "aum": 215000000000, "type": "single_family", "investment_focus": ["diversified", "retail", "real_estate"], "global_rank": 1},
    {"name": "Koch Industries", "city": "Wichita", "state": "Kansas", "founding_family": "Koch", "wealth_source": "Koch Industries", "aum": 125000000000, "type": "single_family", "investment_focus": ["energy", "manufacturing", "technology"], "global_rank": 2},
    {"name": "Mars Family Office", "city": "McLean", "state": "Virginia", "founding_family": "Mars", "wealth_source": "Mars Inc", "aum": 94000000000, "type": "single_family", "investment_focus": ["consumer", "food", "pet_care"], "global_rank": 3},
    {"name": "Cargill-MacMillan Family Office", "city": "Minneapolis", "state": "Minnesota", "founding_family": "Cargill-MacMillan", "wealth_source": "Cargill", "aum": 47000000000, "type": "single_family", "investment_focus": ["agriculture", "food", "commodities"], "global_rank": 4},
    {"name": "Cox Enterprises", "city": "Atlanta", "state": "Georgia", "founding_family": "Cox", "wealth_source": "Cox Communications", "aum": 31000000000, "type": "single_family", "investment_focus": ["media", "automotive", "technology"], "global_rank": 5},
    {"name": "SC Johnson Family Office", "city": "Racine", "state": "Wisconsin", "founding_family": "Johnson", "wealth_source": "SC Johnson", "aum": 28000000000, "type": "single_family", "investment_focus": ["consumer_products", "real_estate"], "global_rank": 6},
    {"name": "Pritzker Group", "city": "Chicago", "state": "Illinois", "founding_family": "Pritzker", "wealth_source": "Hyatt Hotels", "aum": 15000000000, "type": "multi_family", "investment_focus": ["hospitality", "private_equity", "venture_capital"], "global_rank": 7},
    {"name": "Bezos Expeditions", "city": "Seattle", "state": "Washington", "founding_family": "Bezos", "wealth_source": "Amazon", "aum": 10000000000, "type": "single_family", "investment_focus": ["technology", "space", "media", "real_estate"], "global_rank": 8},
    {"name": "Soros Fund Management", "city": "New York", "state": "New York", "founding_family": "Soros", "wealth_source": "Hedge Fund", "aum": 28000000000, "type": "single_family", "investment_focus": ["macro", "equities", "philanthropy"], "global_rank": 9},
    {"name": "Icahn Enterprises", "city": "New York", "state": "New York", "founding_family": "Icahn", "wealth_source": "Investments", "aum": 18000000000, "type": "single_family", "investment_focus": ["activist_investing", "energy", "automotive"], "global_rank": 10},
    {"name": "Dell Technologies Capital", "city": "Austin", "state": "Texas", "founding_family": "Dell", "wealth_source": "Dell Technologies", "aum": 22000000000, "type": "single_family", "investment_focus": ["technology", "venture_capital", "private_equity"], "global_rank": 11},
    {"name": "Hillspire", "city": "Mountain View", "state": "California", "founding_family": "Brin", "wealth_source": "Google", "aum": 15000000000, "type": "single_family", "investment_focus": ["technology", "life_sciences", "climate"], "global_rank": 12},
    {"name": "Cascade Investment LLC", "city": "Kirkland", "state": "Washington", "founding_family": "Gates", "wealth_source": "Microsoft", "aum": 80000000000, "type": "single_family", "investment_focus": ["diversified", "real_estate", "hospitality", "energy"], "global_rank": 13},
    {"name": "Ballmer Group", "city": "Bellevue", "state": "Washington", "founding_family": "Ballmer", "wealth_source": "Microsoft", "aum": 7000000000, "type": "single_family", "investment_focus": ["philanthropy", "sports", "technology"], "global_rank": 14},
    {"name": "Ellison Family Office", "city": "Woodside", "state": "California", "founding_family": "Ellison", "wealth_source": "Oracle", "aum": 25000000000, "type": "single_family", "investment_focus": ["technology", "real_estate", "healthcare", "sports"], "global_rank": 15},
    {"name": "Bloomberg Family Office", "city": "New York", "state": "New York", "founding_family": "Bloomberg", "wealth_source": "Bloomberg LP", "aum": 70000000000, "type": "single_family", "investment_focus": ["media", "technology", "philanthropy", "climate"], "global_rank": 16},
    {"name": "Zuckerberg Chan Initiative", "city": "Palo Alto", "state": "California", "founding_family": "Zuckerberg", "wealth_source": "Meta/Facebook", "aum": 45000000000, "type": "single_family", "investment_focus": ["education", "healthcare", "technology", "science"], "global_rank": 17},
    {"name": "Page Family Office", "city": "Palo Alto", "state": "California", "founding_family": "Page", "wealth_source": "Google", "aum": 20000000000, "type": "single_family", "investment_focus": ["technology", "flying_cars", "space", "ai"], "global_rank": 18},
    {"name": "Griffin Family Office", "city": "Chicago", "state": "Illinois", "founding_family": "Griffin", "wealth_source": "Citadel", "aum": 35000000000, "type": "single_family", "investment_focus": ["real_estate", "art", "philanthropy"], "global_rank": 19},
    {"name": "Simons Foundation", "city": "New York", "state": "New York", "founding_family": "Simons", "wealth_source": "Renaissance Technologies", "aum": 25000000000, "type": "single_family", "investment_focus": ["science", "mathematics", "education", "autism_research"], "global_rank": 20},
    
    # Additional prominent family offices
    {"name": "Willett Advisors", "city": "New York", "state": "New York", "founding_family": "Bloomberg", "wealth_source": "Bloomberg LP", "aum": 70000000000, "type": "single_family", "investment_focus": ["diversified", "private_equity", "real_estate"]},
    {"name": "Laurene Powell Jobs' Emerson Collective", "city": "Palo Alto", "state": "California", "founding_family": "Powell Jobs", "wealth_source": "Apple/Disney", "aum": 35000000000, "type": "single_family", "investment_focus": ["media", "education", "immigration", "environment"]},
    {"name": "Reinhart Partners", "city": "Milwaukee", "state": "Wisconsin", "type": "multi_family", "investment_focus": ["equities", "fixed_income"]},
    {"name": "Fiduciary Trust Company", "city": "Boston", "state": "Massachusetts", "type": "multi_family", "aum": 30000000000, "investment_focus": ["wealth_management", "trust_services"]},
    {"name": "Bessemer Trust", "city": "New York", "state": "New York", "founding_family": "Phipps", "wealth_source": "Carnegie Steel", "aum": 165000000000, "type": "multi_family", "investment_focus": ["wealth_management", "private_equity", "real_estate"]},
    {"name": "Rockefeller Capital Management", "city": "New York", "state": "New York", "founding_family": "Rockefeller", "wealth_source": "Standard Oil", "aum": 100000000000, "type": "multi_family", "investment_focus": ["wealth_management", "sustainable_investing"]},
    {"name": "Pitcairn", "city": "Philadelphia", "state": "Pennsylvania", "founding_family": "Pitcairn", "wealth_source": "PPG Industries", "aum": 7000000000, "type": "multi_family", "investment_focus": ["wealth_management", "family_governance"]},
    {"name": "Glenmede", "city": "Philadelphia", "state": "Pennsylvania", "founding_family": "Pew", "wealth_source": "Sun Oil", "aum": 45000000000, "type": "multi_family", "investment_focus": ["wealth_management", "investment_management"]},
    {"name": "Northern Trust", "city": "Chicago", "state": "Illinois", "type": "multi_family", "aum": 1500000000000, "investment_focus": ["wealth_management", "asset_management", "banking"]},
    {"name": "Atlantic Trust", "city": "Atlanta", "state": "Georgia", "type": "multi_family", "aum": 30000000000, "investment_focus": ["wealth_management", "investment_advisory"]},
    {"name": "Threshold Group", "city": "Gig Harbor", "state": "Washington", "type": "multi_family", "investment_focus": ["impact_investing", "sustainable"]},
    {"name": "Pathstone", "city": "Englewood", "state": "New Jersey", "type": "multi_family", "aum": 35000000000, "investment_focus": ["wealth_management", "family_office_services"]},
    {"name": "Tiedemann Advisors", "city": "New York", "state": "New York", "type": "multi_family", "aum": 30000000000, "investment_focus": ["wealth_management", "impact_investing"]},
    {"name": "BBR Partners", "city": "New York", "state": "New York", "type": "multi_family", "aum": 25000000000, "investment_focus": ["wealth_management", "tax_planning"]},
    {"name": "Silvercrest Asset Management", "city": "New York", "state": "New York", "type": "multi_family", "aum": 35000000000, "investment_focus": ["equities", "fixed_income", "alternatives"]},
    {"name": "Whittier Trust", "city": "South Pasadena", "state": "California", "type": "multi_family", "aum": 15000000000, "investment_focus": ["wealth_management", "trust_services"]},
    {"name": "Tolleson Wealth Management", "city": "Dallas", "state": "Texas", "type": "multi_family", "aum": 12000000000, "investment_focus": ["wealth_management", "family_office"]},
    {"name": "Signature", "city": "Norfolk", "state": "Virginia", "type": "multi_family", "aum": 8000000000, "investment_focus": ["wealth_management", "investment_management"]},
    {"name": "Chilton Trust", "city": "New York", "state": "New York", "type": "multi_family", "aum": 5000000000, "investment_focus": ["equities", "alternatives"]},
    {"name": "Veritable LP", "city": "Newtown Square", "state": "Pennsylvania", "type": "multi_family", "aum": 20000000000, "investment_focus": ["wealth_management", "alternatives"]},
    {"name": "7 Mile Advisors", "city": "Ponte Vedra Beach", "state": "Florida", "type": "multi_family", "investment_focus": ["m&a_advisory", "private_capital"]},
    {"name": "Wealthspire Advisors", "city": "New York", "state": "New York", "type": "multi_family", "aum": 20000000000, "investment_focus": ["wealth_management", "financial_planning"]},
    {"name": "Cresset Capital", "city": "Chicago", "state": "Illinois", "type": "multi_family", "aum": 50000000000, "investment_focus": ["wealth_management", "private_investments"]},
    {"name": "Iconiq Capital", "city": "San Francisco", "state": "California", "type": "multi_family", "aum": 80000000000, "investment_focus": ["technology", "venture_capital", "growth_equity"]},
    {"name": "Tiger Global Management", "city": "New York", "state": "New York", "founding_family": "Coleman", "wealth_source": "Hedge Fund", "aum": 95000000000, "type": "single_family", "investment_focus": ["technology", "venture_capital", "public_equities"]},
    {"name": "Coatue Management", "city": "New York", "state": "New York", "founding_family": "Laffont", "wealth_source": "Hedge Fund", "aum": 48000000000, "type": "single_family", "investment_focus": ["technology", "venture_capital"]},
    {"name": "Dragoneer Investment Group", "city": "San Francisco", "state": "California", "type": "single_family", "aum": 25000000000, "investment_focus": ["technology", "growth_equity"]},
    {"name": "General Atlantic", "city": "New York", "state": "New York", "type": "multi_family", "aum": 84000000000, "investment_focus": ["growth_equity", "technology", "healthcare"]},
    {"name": "Insight Partners", "city": "New York", "state": "New York", "type": "multi_family", "aum": 90000000000, "investment_focus": ["software", "technology", "growth_equity"]},
    {"name": "Thrive Capital", "city": "New York", "state": "New York", "founding_family": "Kushner", "wealth_source": "Investments", "aum": 18000000000, "type": "single_family", "investment_focus": ["technology", "venture_capital", "media"]},
    {"name": "Founders Fund", "city": "San Francisco", "state": "California", "founding_family": "Thiel", "wealth_source": "PayPal", "aum": 12000000000, "type": "single_family", "investment_focus": ["technology", "venture_capital", "deep_tech"]},
    {"name": "Andreessen Horowitz", "city": "Menlo Park", "state": "California", "founding_family": "Andreessen/Horowitz", "wealth_source": "Netscape/Opsware", "aum": 35000000000, "type": "multi_family", "investment_focus": ["technology", "venture_capital", "crypto"]},
    {"name": "Sequoia Capital", "city": "Menlo Park", "state": "California", "type": "multi_family", "aum": 85000000000, "investment_focus": ["technology", "venture_capital", "growth"]},
    {"name": "Kleiner Perkins", "city": "Menlo Park", "state": "California", "type": "multi_family", "aum": 18000000000, "investment_focus": ["technology", "venture_capital", "cleantech"]},
    {"name": "Greylock Partners", "city": "Menlo Park", "state": "California", "type": "multi_family", "aum": 5000000000, "investment_focus": ["technology", "venture_capital", "enterprise"]},
    {"name": "Benchmark", "city": "San Francisco", "state": "California", "type": "multi_family", "aum": 4000000000, "investment_focus": ["technology", "venture_capital", "consumer"]},
    {"name": "Lightspeed Venture Partners", "city": "Menlo Park", "state": "California", "type": "multi_family", "aum": 18000000000, "investment_focus": ["technology", "venture_capital", "enterprise"]},
    {"name": "Accel", "city": "Palo Alto", "state": "California", "type": "multi_family", "aum": 50000000000, "investment_focus": ["technology", "venture_capital", "growth"]},
    {"name": "Index Ventures", "city": "San Francisco", "state": "California", "type": "multi_family", "aum": 16000000000, "investment_focus": ["technology", "venture_capital", "fintech"]},
    {"name": "NEA (New Enterprise Associates)", "city": "Menlo Park", "state": "California", "type": "multi_family", "aum": 25000000000, "investment_focus": ["technology", "healthcare", "venture_capital"]},
    {"name": "Battery Ventures", "city": "Boston", "state": "Massachusetts", "type": "multi_family", "aum": 13000000000, "investment_focus": ["technology", "venture_capital", "growth"]},
    {"name": "GGV Capital", "city": "Menlo Park", "state": "California", "type": "multi_family", "aum": 9000000000, "investment_focus": ["technology", "venture_capital", "cross_border"]},
    {"name": "IVP (Institutional Venture Partners)", "city": "Menlo Park", "state": "California", "type": "multi_family", "aum": 9000000000, "investment_focus": ["technology", "growth_equity"]},
    {"name": "Norwest Venture Partners", "city": "Palo Alto", "state": "California", "type": "multi_family", "aum": 12500000000, "investment_focus": ["technology", "healthcare", "venture_capital"]},
    {"name": "Mayfield Fund", "city": "Menlo Park", "state": "California", "type": "multi_family", "aum": 3000000000, "investment_focus": ["technology", "venture_capital", "enterprise"]},
    {"name": "Redpoint Ventures", "city": "Menlo Park", "state": "California", "type": "multi_family", "aum": 6000000000, "investment_focus": ["technology", "venture_capital", "infrastructure"]},
    {"name": "Spark Capital", "city": "Boston", "state": "Massachusetts", "type": "multi_family", "aum": 5000000000, "investment_focus": ["technology", "venture_capital", "consumer"]},
    {"name": "Union Square Ventures", "city": "New York", "state": "New York", "type": "multi_family", "aum": 2000000000, "investment_focus": ["technology", "venture_capital", "crypto"]},
    {"name": "First Round Capital", "city": "San Francisco", "state": "California", "type": "multi_family", "aum": 1500000000, "investment_focus": ["technology", "seed", "venture_capital"]},
    {"name": "Felicis Ventures", "city": "Menlo Park", "state": "California", "type": "multi_family", "aum": 3000000000, "investment_focus": ["technology", "seed", "venture_capital"]},
    {"name": "Initialized Capital", "city": "San Francisco", "state": "California", "type": "multi_family", "aum": 700000000, "investment_focus": ["technology", "seed", "venture_capital"]},
    {"name": "Lux Capital", "city": "New York", "state": "New York", "type": "multi_family", "aum": 5000000000, "investment_focus": ["deep_tech", "science", "venture_capital"]},
    {"name": "Khosla Ventures", "city": "Menlo Park", "state": "California", "founding_family": "Khosla", "wealth_source": "Sun Microsystems", "aum": 15000000000, "type": "single_family", "investment_focus": ["technology", "cleantech", "healthcare"]},
    {"name": "Social Capital", "city": "Palo Alto", "state": "California", "founding_family": "Palihapitiya", "wealth_source": "Facebook", "aum": 3000000000, "type": "single_family", "investment_focus": ["technology", "healthcare", "education"]},
]

def generate_sql():
    """Generate SQL insert statements for family offices"""
    sql_statements = []
    
    for i, fo in enumerate(family_offices_data, 1):
        name = fo.get('name', '').replace("'", "''")
        slug = fo.get('name', '').lower().replace(' ', '-').replace("'", '').replace('.', '').replace(',', '')
        fo_type = fo.get('type', 'single_family')
        founding_family = fo.get('founding_family', '').replace("'", "''") if fo.get('founding_family') else 'NULL'
        wealth_source = fo.get('wealth_source', '').replace("'", "''") if fo.get('wealth_source') else 'NULL'
        aum = fo.get('aum', 'NULL')
        city = fo.get('city', '').replace("'", "''")
        state = fo.get('state', '').replace("'", "''")
        description = fo.get('description', '').replace("'", "''") if fo.get('description') else ''
        
        # Determine AUM range
        aum_range = 'NULL'
        if aum and aum != 'NULL':
            if aum < 100000000:
                aum_range = "'under_100m'"
            elif aum < 500000000:
                aum_range = "'100m_500m'"
            elif aum < 1000000000:
                aum_range = "'500m_1b'"
            elif aum < 5000000000:
                aum_range = "'1b_5b'"
            elif aum < 10000000000:
                aum_range = "'5b_10b'"
            elif aum < 50000000000:
                aum_range = "'10b_50b'"
            else:
                aum_range = "'50b_plus'"
        
        # Key contacts JSON
        key_contacts = []
        if fo.get('contact_name'):
            contact = {
                "name": fo.get('contact_name'),
                "title": fo.get('contact_title', ''),
            }
            if fo.get('contact_email'):
                contact["email"] = fo.get('contact_email')
            key_contacts.append(contact)
        
        key_contacts_json = json.dumps(key_contacts).replace("'", "''") if key_contacts else 'NULL'
        investment_focus_json = json.dumps(fo.get('investment_focus', [])).replace("'", "''")
        
        global_rank = fo.get('global_rank', 'NULL')
        
        sql = f"""INSERT INTO family_offices (name, slug, type, foundingFamily, wealthSource, aum, aumRange, city, state, country, region, investmentFocus, keyContacts, globalRank, dataSource, dataConfidence, isActive, createdAt, updatedAt)
VALUES ('{name}', '{slug}', '{fo_type}', {f"'{founding_family}'" if founding_family != 'NULL' else 'NULL'}, {f"'{wealth_source}'" if wealth_source != 'NULL' else 'NULL'}, {aum}, {aum_range}, '{city}', '{state}', 'USA', 'north_america', '{investment_focus_json}', {f"'{key_contacts_json}'" if key_contacts_json != 'NULL' else 'NULL'}, {global_rank}, 'web_scrape', 'medium', 1, NOW(), NOW());"""
        
        sql_statements.append(sql)
    
    return '\n'.join(sql_statements)

if __name__ == '__main__':
    sql = generate_sql()
    print(sql)
    
    # Also save to file
    with open('/home/ubuntu/anavi/data/family_offices_insert.sql', 'w') as f:
        f.write(sql)
    
    print(f"\n\nGenerated {len(family_offices_data)} family office records")
