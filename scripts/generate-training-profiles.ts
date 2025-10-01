/**
 * Generate AI Training Profiles
 * Uses Claude to generate realistic, diverse user profiles for model training
 *
 * Usage: npx tsx scripts/generate-training-profiles.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface TrainingProfile {
  // Demographics
  age_range: string;
  location: string;
  climate: string;

  // Skin characteristics
  skin_type: string;
  tzone_oiliness: string;
  cheek_texture: string;
  pore_size: string;
  hydration_level: string;

  // Concerns
  concerns: string[];
  breakout_frequency?: string;
  redness_frequency?: string;

  // Behavior
  stress_impact?: string;
  seasonal_changes?: boolean;

  // Goals
  goals: string[];

  // Ground truth (for training)
  ground_truth_archetype: string;
  confidence: number;
}

const ARCHETYPES = [
  'desert_rose',
  'ocean_pearl',
  'mountain_sage',
  'garden_bloom',
  'desert_cactus',
  'snow_crystal',
  'volcano_ember',
];

const LOCATIONS = [
  { city: 'Dubai', climate: 'hot_humid' },
  { city: 'Singapore', climate: 'hot_humid' },
  { city: 'Los Angeles', climate: 'temperate_dry' },
  { city: 'London', climate: 'cold_humid' },
  { city: 'New York', climate: 'temperate' },
  { city: 'Tokyo', climate: 'temperate_humid' },
  { city: 'Phoenix', climate: 'hot_dry' },
  { city: 'Stockholm', climate: 'cold_dry' },
];

async function generateProfile(archetype: string): Promise<TrainingProfile> {
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

  const prompt = `Generate a realistic skincare user profile for a person with "${archetype}" skin archetype.

ARCHETYPE DEFINITIONS:
- desert_rose: Combination skin with oily T-zone and dry cheeks, resilient
- ocean_pearl: Naturally balanced, low-maintenance, lucky
- mountain_sage: Dry skin needing gentle hydration
- garden_bloom: Sensitive, reactive skin with redness
- desert_cactus: Oily, acne-prone, can handle strong actives
- snow_crystal: Very dry, needs intense moisture
- volcano_ember: Severe acne, very oily

Generate a profile matching "${archetype}" with:
- Demographics (age 18-65, from ${location.city})
- Detailed skin characteristics
- 2-4 realistic concerns
- 1-3 goals
- Realistic behavioral patterns

Output ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{
  "age_range": "25_34",
  "location": "${location.city}",
  "climate": "${location.climate}",
  "skin_type": "oily|dry|combo|sensitive|normal",
  "tzone_oiliness": "very_oily|oily|normal|dry",
  "cheek_texture": "smooth|rough|flaky|normal",
  "pore_size": "large|medium|small",
  "hydration_level": "very_dry|dry|normal|hydrated",
  "concerns": ["acne", "aging"],
  "breakout_frequency": "daily|weekly|monthly|rarely|never",
  "redness_frequency": "constant|frequent|occasional|rare|never",
  "stress_impact": "high|medium|low|none",
  "seasonal_changes": true,
  "goals": ["clear_skin", "anti_aging"],
  "ground_truth_archetype": "${archetype}",
  "confidence": 0.95
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON (in case Claude adds markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const profile = JSON.parse(jsonMatch[0]);
    return profile;
  } catch (error: any) {
    console.error(`Failed to generate profile for ${archetype}:`, error.message);
    throw error;
  }
}

async function generateDataset(profilesPerArchetype: number = 150) {
  console.log('🤖 AI Training Profile Generator\n');
  console.log(`Generating ${profilesPerArchetype} profiles per archetype...`);
  console.log(`Total profiles: ${profilesPerArchetype * ARCHETYPES.length}\n`);

  const allProfiles: TrainingProfile[] = [];
  let completed = 0;
  const total = profilesPerArchetype * ARCHETYPES.length;

  for (const archetype of ARCHETYPES) {
    console.log(`\n📝 Generating ${profilesPerArchetype} profiles for ${archetype}...`);

    for (let i = 0; i < profilesPerArchetype; i++) {
      try {
        const profile = await generateProfile(archetype);
        allProfiles.push(profile);
        completed++;

        // Progress indicator
        if ((i + 1) % 10 === 0) {
          console.log(`   ✓ ${i + 1}/${profilesPerArchetype} (${Math.round((completed / total) * 100)}% total)`);
        }

        // Rate limiting (Claude has 50 req/min limit)
        await new Promise(resolve => setTimeout(resolve, 1200)); // ~1.2s delay = 50/min
      } catch (error: any) {
        console.error(`   ✗ Failed profile ${i + 1}: ${error.message}`);
        i--; // Retry
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
      }
    }

    console.log(`   ✅ Completed ${archetype}`);
  }

  // Statistics
  const stats = {
    total: allProfiles.length,
    by_archetype: {} as Record<string, number>,
    by_climate: {} as Record<string, number>,
    by_skin_type: {} as Record<string, number>,
  };

  for (const profile of allProfiles) {
    stats.by_archetype[profile.ground_truth_archetype] =
      (stats.by_archetype[profile.ground_truth_archetype] || 0) + 1;
    stats.by_climate[profile.climate] =
      (stats.by_climate[profile.climate] || 0) + 1;
    stats.by_skin_type[profile.skin_type] =
      (stats.by_skin_type[profile.skin_type] || 0) + 1;
  }

  return { profiles: allProfiles, stats };
}

async function main() {
  const profilesPerArchetype = parseInt(process.argv[2]) || 150; // Default 150 per archetype = 1050 total

  console.log('Starting profile generation...\n');
  const startTime = Date.now();

  const { profiles, stats } = await generateDataset(profilesPerArchetype);

  // Save to file
  const outputDir = path.join(process.cwd(), 'ml', 'training');
  const outputFile = path.join(outputDir, 'ai_generated_profiles.json');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(profiles, null, 2));

  // Save stats
  const statsFile = path.join(outputDir, 'profile_stats.json');
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n\n✅ Generation Complete!\n');
  console.log('📊 Statistics:');
  console.log(`   Total profiles: ${stats.total}`);
  console.log(`   Time: ${duration} minutes`);
  console.log('\n   By Archetype:');
  for (const [archetype, count] of Object.entries(stats.by_archetype)) {
    console.log(`      ${archetype}: ${count}`);
  }
  console.log('\n   By Climate:');
  for (const [climate, count] of Object.entries(stats.by_climate)) {
    console.log(`      ${climate}: ${count}`);
  }
  console.log('\n   By Skin Type:');
  for (const [skinType, count] of Object.entries(stats.by_skin_type)) {
    console.log(`      ${skinType}: ${count}`);
  }

  console.log(`\n💾 Saved to: ${outputFile}`);
  console.log(`📈 Stats saved to: ${statsFile}`);

  console.log('\n🚀 Next Steps:');
  console.log('   1. Review generated profiles');
  console.log('   2. Run: cd ml/worker && python retraining_worker.py');
  console.log('   3. Trigger training: curl -X POST http://localhost:8081/api/retrain');
  console.log('   4. New models will be saved to ml/models/versions/');
}

main().catch(console.error);