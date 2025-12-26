import {createClient} from '@supabase/supabase-js';
import {config} from "dotenv";
import express from "express";

config();
const app = express();
app.use(express.static("public"));

// Supabase consts
const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_API_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_API_KEY;
const PORT = process.env.PORT || 3000;

// Table Names
const TABLE_EARTHQUAKE = "earthquake_risk_full";
const TABLE_EARTHQUAKE_DESCRIPTION = "";
const TABLE_CRIME = "crime_data"
const TABLE_CRIME_DESCRIPTION = "";
const TABLE_FLOOD_RIVER = "river_flood_map";
const TABLE_FLOOD_PLUVIAL = "pluvial_flood_map";
const TABLE_FLOOD_DESCRIPTION = "";


// Make authenticated client (only reading data is enabled)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

app.get("/api/suggest", async (req, res) => {
    // Only 1000 rows per API request, according to the default setting of Supabase
    const {start = 0, end = 999} = req.query;

    const {data, error} = await supabase
        .from(TABLE_EARTHQUAKE)
        .select('municipality, district')
        .range(start, end);

    if (error) return res.status(400).send({"error": error});
    res.json(data);
});

app.get("/api/search_earthquake", async (req, res) => {
    const {municipality, district} = req.query;

    const {data, error} = await supabase
        .from(TABLE_EARTHQUAKE)
        .select('*')
        .eq('municipality', municipality)
        .eq('district', district); // filter implies "AND" for previous clauses

    if (error) return res.status(400).send({"error": error});
    res.json(data);
});

app.get("/api/search_crime", async (req, res) => {
    const {municipality, district} = req.query;

    // Because of a specific database value problem.
    // This should be fixed in the database later.
    let municipality_fixed;
    let district_fixed;
    if (municipality == "町田市") {
        municipality_fixed = "町";
        district_fixed = "田市" + district;
    } else {
        municipality_fixed = municipality;
        district_fixed = district;
    }

    const {data, error} = await supabase
        .from(TABLE_CRIME)
        .select('*')
        .eq('municipality', municipality_fixed)
        .eq('district', district_fixed); // filter implies "AND" for previous clauses

    if (error) return res.status(400).send({"error": error});

    res.json(data);
});

app.get("/api/search_crime_per_municipality", async (req, res) => {
    const {municipality} = req.query;

    // Because of a specific database value problem.
    // This should be fixed in the database later.
    let municipality_fixed;
    let district;
    if (municipality == "町田市") {
        municipality_fixed = "町";
        district = '田市計';
    } else {
        municipality_fixed = municipality;
        district = '計'
    }

    const {data, error} = await supabase
        .from(TABLE_CRIME)
        .select('*')
        .eq('municipality', municipality_fixed)
        .eq('district', district); // Means "sum". Follow the table format.

    if (error) return res.status(400).send({"error": error});

    res.json(data);

});

app.get('/api/search_flood', async (req, res) => {
    try {
        const {municipality} = req.query;

        if (!municipality) {
            return res.status(400).json({
                error: 'municipality parameter is required'
            });
        }

        // execute a query which is defined in supabase
        const {data, error} = await supabase.rpc('get_combined_flood_maps', {
            target_municipality: municipality
        });

        if (error) {
            console.error('Supabase RPC error:', error)
            return res.status(500).json({error: 'Database query failed'})
        }

        res.json(data);

    } catch (error) {
        console.error('Server error:', error)
        res.status(500).json({error: 'Internal server error'})
    }
});

app.get("/api/search_description", async (req, res) => {
    try {
        const {municipality} = req.query;

        if (!municipality) {
            return res.status(400).json({
                error: 'municipality parameter is required'
            });
        }

        // execute a query which is defined in supabase
        const {data, error} = await supabase.rpc('get_description', {
            target_municipality: municipality
        });

        if (error) {
            console.error('Supabase RPC error:', error)
            return res.status(500).json({error: 'Database query failed'})
        }

        res.json(data);

    } catch (error) {
        console.error('Server error:', error)
        res.status(500).json({error: 'Internal server error'})
    }
})

// start localhost server
app.listen(PORT, () => {
    console.log(`Server running`);
});
