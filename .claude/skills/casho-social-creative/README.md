# Casho Social Creative Skill

A Claude Code skill for Casho social media creative direction and production.

## Install

Copy the entire `casho-social-creative` folder into:

- macOS / Linux: `~/.claude/skills/casho-social-creative/`
- Windows: `%USERPROFILE%\\.claude\\skills\\casho-social-creative\\`

The folder must contain `SKILL.md` directly.

## Add your brand assets

Place the official Casho logo in `assets/` and name it `casho-logo.png` (or update the asset reference if you use SVG). Prefer a transparent PNG or SVG. Add approved product screenshots and brand references only when useful.

The skill intentionally does not invent Casho's exact blue hex value. It instructs Claude to sample the official logo or use your approved brand guide.

## Use

In Claude Code, invoke:

`/casho-social-creative`

Or ask naturally, for example:
- "Create a 5-slide Instagram carousel about the problem of managing orders across separate channels."
- "Create a premium Instagram Story campaign for Casho."
- "Develop a 20-second Reel concept with storyboard, motion direction, and cover."
- "Build a consistent 9-post Instagram grid art direction."

## Claude Design

Use Claude Design as the visual production environment when it is available in your Claude workflow. This skill defines the creative direction, constraints, and quality checks; it does not itself install or unlock Claude Design or guarantee that a finished image/video export is available. If Claude Design is unavailable in the current session, Claude should provide a production-ready design brief/storyboard and clearly state the limitation.

## Important

This is a social-media design skill, not a website, UI, or coding skill. Keep the output focused on posts, carousels, stories, reels, and campaign assets.
