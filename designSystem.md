# Labora Design System

## 1. Brand Overview

**Product:** Labora  
**Type:** Virtual Science Laboratory Web App  
**Audience:** Students, teachers, and schools  
**Core Feeling:** Fun, colorful, curious, interactive, friendly, and science-driven

### Product Principle

> Learn science by doing, not only by reading.

Labora should feel like a place students want to explore, not another formal school assignment.

The interface must be:

- Playful
- Colorful
- Friendly
- Curious
- Interactive
- Approachable
- Clean
- Easy to understand
- Not overly professional
- Not childish

### Visual Balance

Use this rule:

**70% clean structure + 30% playful personality**

The layout must remain easy to scan and understand while colors, mascots, illustrations, motion, and copy make the experience feel fun.

---

# 2. Brand Personality

Labora should communicate:

- Curiosity
- Discovery
- Exploration
- Experimentation
- Confidence
- Friendly learning
- Positive mistakes
- Scientific thinking

Avoid a visual identity that feels like:

- Corporate SaaS
- Banking software
- Enterprise dashboard
- Government portal
- Generic LMS
- Serious academic journal
- Elementary school game

---

# 3. Color System

## Primary Palette

### Sky Blue

Main Labora brand color.

| Token | Value |
|---|---|
| `blue-100` | `#EAF9FF` |
| `blue-300` | `#A7E5FF` |
| `blue-400` | `#7ED6FF` |
| `blue-500` | `#5EC8FF` |
| `blue-600` | `#39B8F5` |

Usage:

- Primary buttons
- Active navigation
- Main highlights
- Information states
- Interactive controls
- Chemistry accents

---

### Candy Pink

Secondary playful accent.

| Token | Value |
|---|---|
| `pink-100` | `#FFF0F7` |
| `pink-300` | `#FFB7D8` |
| `pink-400` | `#FF95C6` |
| `pink-500` | `#FF78B8` |
| `pink-600` | `#F45AA4` |

Usage:

- Secondary CTA
- Quiz accents
- Badges
- Mascot details
- Reward moments
- Fun decoration

---

### Lime Green

Primary success and Biology color.

| Token | Value |
|---|---|
| `green-100` | `#F1FCEB` |
| `green-300` | `#B8F0A2` |
| `green-400` | `#98E67A` |
| `green-500` | `#7ED957` |
| `green-600` | `#63C63E` |

Usage:

- Biology lab
- Correct answers
- Completed steps
- Success feedback
- Experiment completion
- Progress

---

### Sunny Yellow

Energy and reward color.

| Token | Value |
|---|---|
| `yellow-100` | `#FFF9DB` |
| `yellow-300` | `#FFED9C` |
| `yellow-400` | `#FFE36F` |
| `yellow-500` | `#FFD84D` |
| `yellow-600` | `#F5C933` |

Usage:

- Physics
- Rewards
- Highlights
- Stars
- Attention markers
- Achievement cards

---

# 4. Neutral Colors

| Token | Value |
|---|---|
| `ink-900` | `#1F2430` |
| `ink-700` | `#4C546A` |
| `ink-500` | `#7A8194` |
| `gray-300` | `#DDE5F0` |
| `gray-200` | `#E9EEF5` |
| `gray-100` | `#EEF2F7` |
| `cloud` | `#F8FBFF` |
| `white` | `#FFFFFF` |

Usage:

- Main text: `ink-900`
- Secondary text: `ink-700`
- Muted text: `ink-500`
- Border: `gray-300`
- App background: `cloud`
- Main surface: `white`

Do not use pure black unless absolutely necessary.

---

# 5. Semantic Colors

| State | Color |
|---|---|
| Success | `#7ED957` |
| Warning | `#FFC857` |
| Error | `#FF6B6B` |
| Information | `#5EC8FF` |

Error states should feel helpful rather than aggressive.

Prefer:

> That action does not match this step yet.

Avoid:

> INVALID ACTION

---

# 6. Lab Identity

Each laboratory should have a clear identity while remaining part of the same product.

## Chemistry

**Primary:** `#5EC8FF`  
**Accent:** `#FF78B8`

Visual motifs:

- Bubbles
- Beakers
- Molecules
- Drops
- Reactions

Mascot:

**Leo the Lion Scientist**

---

## Physics

**Primary:** `#FFD84D`  
**Accent:** `#5EC8FF`

Visual motifs:

- Electricity
- Motion
- Energy
- Circuits
- Waves
- Atoms

Mascot:

**Ellie the Elephant Scientist**

---

## Biology

**Primary:** `#7ED957`  
**Accent:** `#FFD84D`

Visual motifs:

- Cells
- Leaves
- Microscope
- DNA
- Nature

Mascot:

**Bibi the Biology Scientist**

Possible animal directions:

- Bunny
- Bear
- Panda

Choose one and keep it consistent across the product.

---

# 7. Typography

## Heading Font

**Fredoka**

Use for:

- Page titles
- Section titles
- Hero copy
- Experiment titles
- Mascot speech headings

Characteristics:

- Rounded
- Friendly
- Playful
- Readable

---

## Body Font

**Nunito Sans**

Use for:

- Body text
- Instructions
- Labels
- Quiz text
- Navigation
- Tables
- Forms

Characteristics:

- Friendly
- Highly readable
- Suitable for longer educational text

---

## Type Scale

| Style | Size | Weight |
|---|---:|---:|
| Display | 48px | 700 |
| H1 | 40px | 700 |
| H2 | 32px | 700 |
| H3 | 24px | 600 |
| H4 | 20px | 600 |
| Body Large | 18px | 400 |
| Body | 16px | 400 |
| Small | 14px | 400 |
| Caption | 12px | 500 |

Mobile sizes may reduce slightly.

Do not use uppercase for large sections unless it is a small UI label.

Preferred:

> Choose your lab

Avoid:

> CHOOSE YOUR LAB

---

# 8. Spacing System

Use an 8-point spacing system.

| Token | Value |
|---|---:|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |

Prefer generous spacing.

Avoid dense layouts.

---

# 9. Shape Language

Core shape characteristics:

- Rounded
- Soft
- Friendly
- Touchable
- Bubble-like

## Border Radius

| Token | Value |
|---|---:|
| `radius-sm` | 12px |
| `radius-md` | 16px |
| `radius-lg` | 24px |
| `radius-xl` | 32px |
| `radius-pill` | 999px |

Default cards should use `16px–24px`.

Buttons should generally use `16px` or pill shapes.

---

# 10. Border System

Default border:

```css
1px solid #DDE5F0
```

Interactive border:

```css
2px solid #5EC8FF
```

Valid drop target:

```css
2px dashed #7ED957
```

Invalid interaction:

```css
2px solid #FF6B6B
```

Do not use heavy dark borders throughout the interface.

---

# 11. Shadow System

Shadows should be soft.

## Card

```css
0 4px 12px rgba(31, 36, 48, 0.08)
```

## Hover

```css
0 8px 20px rgba(31, 36, 48, 0.12)
```

## Floating UI

```css
0 12px 32px rgba(31, 36, 48, 0.16)
```

Avoid:

- Hard black shadows
- Large glow everywhere
- Heavy neumorphism

---

# 12. Mascot System

Mascots are part of Labora's identity and should not be used only as decorative illustrations.

They should act as friendly guides.

## Art Style

- 2D flat illustration
- Rounded proportions
- Medium outline
- Simple shading
- Expressive face
- Large readable silhouette
- Friendly science outfit
- Limited visual detail

Avoid:

- 3D rendering
- Hyper-realism
- Complex anime rendering
- Overly childish proportions

---

## Leo the Lion Scientist

Role:

**Chemistry Guide**

Personality:

- Energetic
- Curious
- Brave
- Experimental

Visual:

- Golden mane
- White lab coat
- Safety goggles
- Blue and pink accessories
- Beaker or test tube

Example copy:

> Leo says: Try adding the indicator next!

---

## Ellie the Elephant Scientist

Role:

**Physics Guide**

Personality:

- Calm
- Smart
- Analytical
- Helpful

Visual:

- Soft blue-gray body
- White lab coat
- Round glasses
- Yellow details
- Circuit board, battery, or light bulb

Example copy:

> Ellie thinks your circuit is missing a connection.

---

## Giffy the Giraffe Scientist

Role:

**Biology Guide**

Personality:

- Observant
- Curious
- Gentle
- Nature-focused

Visual:

- Golden body, brown spots, long neck, and small ossicones
- Green accents
- Microscope
- Leaf or specimen
- Lab coat

Example copy:

> Look closer. Something interesting is hiding inside the cell.

---

# 13. Iconography

Icons should be:

- Rounded
- Friendly
- Easy to recognize
- Consistent stroke width
- Simple
- Slightly playful

Recommended icon categories:

- Home
- Lab
- Flask
- Microscope
- Circuit
- Assignment
- Quiz
- Progress
- Trophy
- Star
- Hint
- Reset
- Play
- Pause
- Book
- Teacher
- Student

Avoid mixing multiple unrelated icon styles.

---

# 14. Illustration System

Visual illustrations should use:

- Flat colors
- Simple highlight
- Simple shadow
- Soft shapes
- Light outlines
- Playful science objects

Decorative elements may include:

- Molecules
- Tiny stars
- Bubbles
- Atom orbit lines
- Leaves
- Sparkles
- Curved lines
- Drops

Keep decorative elements subtle.

They should support the page, not overpower content.

---

# 15. Buttons

## Primary Button

- Background: `blue-500`
- Text: white
- Radius: `16px` or pill
- Font weight: 600
- Minimum height: `44px`

Example:

> Start Experiment

Hover:

- Slight lift
- `blue-600`
- Hover shadow

---

## Secondary Button

- Background: `pink-500`
- Text: white

Example:

> Ask Lab Assistant

---

## Success Button

- Background: `green-500`
- Text: white or dark ink depending on contrast

Example:

> Complete Step

---

## Highlight Button

- Background: `yellow-500`
- Text: `ink-900`

Example:

> Show Hint

---

## Ghost Button

- Transparent background
- Border: `gray-300`
- Text: `ink-700`

Example:

> Reset Experiment

---

## Button Motion

On hover:

```text
translateY(-1px)
```

On press:

```text
scale(0.97)
```

Avoid excessive bouncing on every button.

---

# 16. Cards

Default card:

- White surface
- Radius: `24px`
- Border: `gray-300`
- Soft shadow
- Padding: `24px`

Cards should feel light.

Do not use dark card backgrounds unless specifically needed.

---

# 17. Lab Selection Cards

Each card should contain:

- Lab mascot or illustration
- Lab title
- Short description
- Number of experiments
- CTA
- Lab color accent

Example:

### Chemistry Lab

> Mix, react, observe, and discover.

CTA:

> Enter Chemistry Lab

Cards may have subtle decorative molecules or bubbles in the background.

---

# 18. Experiment Cards

Experiment cards should show:

- Experiment name
- Subject
- Estimated duration
- Difficulty
- Completion state
- Short learning objective
- Start / Continue button

Possible states:

- Not started
- In progress
- Completed
- Assigned

Do not overload cards with too many metadata chips.

---

# 19. Interactive Lab Workspace

This is the most important interface in Labora.

## Desktop Layout

```text
----------------------------------------------------
Top Bar
----------------------------------------------------

|                                      |           |
|                                      |  Tools    |
|         Experiment Workspace         |  Panel    |
|                                      |           |
|                                      |           |

----------------------------------------------------
Step-by-Step Instruction Panel
----------------------------------------------------
```

Recommended ratio:

- Workspace: ~75%
- Tool panel: ~25%

---

## Workspace Style

The workspace should feel like a digital science bench.

Use:

- Soft blue-gray background
- Large rounded panel
- Clear object boundaries
- Spacious interaction area
- Subtle experiment pattern

Empty state copy:

> Drag your tools here and start experimenting!

Avoid cluttering the workspace with decorative UI.

The experiment itself should be the visual focus.

---

# 20. Tools Panel

The tools panel contains draggable objects.

Examples:

- Beaker
- Test tube
- Dropper
- Flask
- Measuring cylinder
- Microscope
- Battery
- Wire
- Resistor
- Lamp

## Tool Card

Each tool card:

- Large object illustration
- Tool label
- Rounded card
- Clear draggable affordance
- Hover state

Hover:

- Slight elevation
- Blue border
- `scale(1.02)`

Dragging:

- Increase shadow
- Slight rotation is allowed
- Highlight valid target zones

---

# 21. Drag-and-Drop States

## Default

Neutral tool card.

## Dragging

- Lift tool card
- Stronger shadow
- Slight scale up

## Valid Target

- Green dashed border
- Subtle green background

## Invalid Target

- Soft red highlight
- Do not use aggressive flashing

## Successful Drop

- Small bounce
- Green confirmation
- Optional sound feedback later

---

# 22. Step-by-Step Instruction Panel

Placed below the experiment workspace.

Example:

```text
Step 2 of 6

Pour 20 mL of Solution A into the beaker.

[Show Hint]
```

Should include:

- Step number
- Instruction
- Optional explanation
- Hint button
- Progress
- Previous step when applicable
- Reset option

Use a mascot bubble occasionally.

Example:

> Leo says: Try using the measuring cylinder first!

Do not use mascot dialogue for every single step.

---

# 23. Progress Indicators

Experiment progress should be easy to read.

Example:

```text
Step 3 / 7
```

Use:

- Rounded progress bars
- Lab theme color
- Small celebratory animation when advancing

Avoid overly complex progress charts inside experiments.

---

# 24. Quiz Components

Quiz cards should feel integrated into the experiment.

## Question Card

- White background
- Radius: `24px`
- Large readable question
- 2–4 answer choices

## Answer Choice

- Rounded
- Neutral default
- Strong hover state
- Large touch target

Correct:

- Green state
- Small positive animation

Incorrect:

- Soft red/pink state
- Explanation displayed directly afterward

---

# 25. Feedback Components

## Correct Action

Example:

> Nice! The beaker is ready.

Use:

- Green accent
- Check icon
- Short animation

---

## Incorrect Action

Example:

> That tool does not match this step yet. Try another one.

Use:

- Pink/red accent
- Helpful explanation
- No harsh error modal

---

## Hint

Example:

> Look for a tool that can measure liquid volume accurately.

Hints should guide, not immediately reveal the answer.

---

# 26. Result Screen

Experiment result pages should feel rewarding.

Show:

- Completion illustration
- Mascot reaction
- Score
- Experiment accuracy
- Quiz accuracy
- Completed steps
- Key learning points
- Incorrect answers
- Explanation

Visual elements:

- Small confetti
- Stars
- Success badge
- Lab color theme

Avoid giant celebration animations that slow the page down.

---

# 27. Achievement System

Achievement examples:

- Lab Explorer
- First Reaction
- pH Master
- Circuit Starter
- Cell Observer
- Perfect Experiment
- Curious Scientist

Badge style:

- Bright colors
- Sticker-like shape
- Simple icon
- Short name

Achievements should be secondary motivation, not the core experience.

---

# 28. Navigation

Main navigation:

- Home
- Labs
- Assignments
- Progress
- Profile

Teacher navigation may add:

- Classes
- Create Assignment
- Results

Navigation should stay simple.

Avoid nested enterprise-style navigation.

---

# 29. Dashboard

Student dashboard should include:

- Greeting
- Continue experiment
- Assigned experiments
- Three lab cards
- Recent activity
- Progress snapshot

Mascot can appear in the greeting area.

Example:

> Ready for another experiment?

Avoid dense analytics.

---

# 30. Teacher UI

Teacher UI may be slightly more structured than student UI but should remain consistent.

Teacher tools:

- Create assignment
- Choose experiment
- Add instructions
- Add quiz questions
- Set hints
- View student progress
- View incorrect answers

Do not transform the teacher dashboard into a complex LMS.

---

# 31. Motion System

Motion should make Labora feel alive.

## Motion Principles

- Soft
- Quick
- Playful
- Informative
- Never distracting

## Timing

| Motion | Duration |
|---|---:|
| Hover | 150–220ms |
| Button press | 100–150ms |
| Panel transition | 250–350ms |
| Success animation | 400–600ms |

## Recommended Motion

- Hover lift
- Button squash
- Drag glow
- Liquid movement
- Bubble animation
- Circuit activation
- Microscope focus
- Small confetti
- Mascot blink
- Mascot wave

Avoid animating everything at once.

---

# 32. Copywriting Tone

Labora speaks like a friendly science companion.

Tone:

- Simple
- Encouraging
- Curious
- Helpful
- Positive

## Preferred Copy

> Let's start experimenting!

> Nice observation!

> Almost there.

> Try another tool.

> Need a hint?

> Great! The circuit is complete.

> Look closer at the sample.

## Avoid

> Operation successful.

> Invalid configuration.

> User must complete the required action.

> Error 403.

> Incorrect procedure.

System errors may still need technical detail when appropriate, but student-facing copy should stay friendly.

---

# 33. Empty States

Empty states should feel inviting.

Examples:

### No assigned experiments

> Nothing assigned yet. Explore a lab while you wait.

### Empty workspace

> Drag your first tool here to begin.

### No completed experiments

> Your science journey starts with your first experiment.

Mascot illustrations may be used here.

---

# 34. Responsive Behavior

## Desktop

Primary lab experience.

Layout:

- Large workspace
- Right tools sidebar
- Bottom instruction panel

## Tablet

- Slightly smaller workspace
- Compact tool panel
- Scrollable tool grid

## Mobile

Do not simply stack every desktop element.

Use:

- Workspace full width
- Tools as bottom drawer
- Step instructions below workspace
- Compact top controls

Some advanced experiments may show a message:

> For the best experiment experience, rotate your device or use a larger screen.

Do not block mobile completely.

---

# 35. Accessibility

The interface should not rely entirely on color.

Use:

- Icons
- Labels
- State text
- Clear focus states

Drag-and-drop actions should have alternatives where possible.

Example:

- Select tool
- Click "Place in workspace"

Maintain sufficient text contrast.

Touch targets should generally be at least `44px`.

---

# 36. Do and Don't

## Do

- Use playful colors
- Keep layouts clean
- Use mascots intentionally
- Use large interactive areas
- Provide clear feedback
- Maintain strong readability
- Keep science objects recognizable
- Use rounded shapes
- Use subtle educational illustrations
- Use motion to explain state changes

## Don't

- Use dark backgrounds as the default
- Use corporate dashboard aesthetics
- Use excessive gradients
- Use excessive glassmorphism
- Use tiny controls
- Use dense tables for students
- Use heavy black borders
- Use 3D mascots
- Use overly realistic lab assets
- Fill every empty area with decoration

---

# 37. Component Priority

When implementing the design system, prioritize:

1. Button
2. Card
3. Tool Card
4. Experiment Workspace
5. Step Instruction Panel
6. Quiz Card
7. Feedback Banner
8. Progress Indicator
9. Lab Selection Card
10. Mascot Speech Bubble
11. Modal
12. Drawer
13. Form Input
14. Badge
15. Tooltip

---

# 38. Recommended Design Tokens

```ts
export const colors = {
  blue: {
    100: "#EAF9FF",
    300: "#A7E5FF",
    400: "#7ED6FF",
    500: "#5EC8FF",
    600: "#39B8F5",
  },
  pink: {
    100: "#FFF0F7",
    300: "#FFB7D8",
    400: "#FF95C6",
    500: "#FF78B8",
    600: "#F45AA4",
  },
  green: {
    100: "#F1FCEB",
    300: "#B8F0A2",
    400: "#98E67A",
    500: "#7ED957",
    600: "#63C63E",
  },
  yellow: {
    100: "#FFF9DB",
    300: "#FFED9C",
    400: "#FFE36F",
    500: "#FFD84D",
    600: "#F5C933",
  },
  ink: {
    500: "#7A8194",
    700: "#4C546A",
    900: "#1F2430",
  },
  gray: {
    100: "#EEF2F7",
    200: "#E9EEF5",
    300: "#DDE5F0",
  },
  cloud: "#F8FBFF",
  white: "#FFFFFF",
  error: "#FF6B6B",
  warning: "#FFC857",
};
```

---

# 39. Tailwind Semantic Direction

Recommended semantic classes:

```text
bg-brand-primary
bg-brand-secondary
bg-success
bg-warning
bg-app
bg-surface

text-primary
text-secondary
text-muted

border-default
border-active
border-success
border-error

lab-chemistry
lab-physics
lab-biology
```

Prefer semantic tokens over scattering raw hex values throughout components.

---

# 40. Final Visual Rule

Every screen should pass this check:

> Does this look like a place where a student wants to experiment, or a place where a student feels like they are filling out school administration?

If it feels like administration, simplify it and add more personality.

If it feels like a children's game, reduce decorative elements and increase structure.

The target is:

**Playful scientific exploration.**
