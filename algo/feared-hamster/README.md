# Le hamster apeuré

Rust command line simulator for the grid-based puzzle **“Le hamster apeuré”**.

The program reads a puzzle configuration file, simulates the hamster's path exactly according to the game rules, and prints the final score.

## Usage

```bash
cargo run -- input.txt
```

The program prints only the final integer score to standard output.

Example:

```bash
cargo run -- input.txt
33
```

## Input format

The input file must use this format:

```text
N
(x, y)
L (x, y) r
B (x, y) g s
S (x, y) g
```

Where:

- `N` is the size of the square grid: `N x N`.
- `(x, y)` on line 2 is the hamster's starting position.
- `L (x, y) r` defines a light at `(x, y)` with range `r`.
- `B (x, y) g s` defines a block at `(x, y)` in group `g`, with state `s`:
  - `1` = active
  - `0` = inactive
- `S (x, y) g` defines a switch at `(x, y)` for group `g`.

Coordinates are zero-indexed. Valid group IDs are from `0` to `5`.

## Grid rules

- The grid is square and has size `N x N`.
- Each coordinate may contain at most one object.
- Lights, blocks, and switches are mutually exclusive.
- The hamster's starting position cannot contain an object.
- Objects must be inside the grid bounds.

## Objects

### Hamster

The hamster starts immobile. During the simulation, it may run in one of four directions:

- North
- South
- East
- West

### Lights

A light is visible to the hamster if:

1. It is in the same row or column as the hamster.
2. Its Manhattan distance from the hamster is less than or equal to its range.
3. No other light and no active block is between the hamster and the light.

Lights are obstacles: the hamster can never step onto a light cell.

### Blocks

Blocks belong to a group from `0` to `5`.

Active blocks:

- Block light visibility.
- Act as obstacles.

Inactive blocks:

- Do not block light visibility.
- Can be safely crossed by the hamster.

### Switches

Switches belong to a group from `0` to `5`.

When the hamster steps onto a switch, every block in the same group toggles state:

- Active blocks become inactive.
- Inactive blocks become active.

Switches do not block visibility and can be safely crossed.

## Simulation rules

The simulation runs in ticks.

### Step A: light detection

At the start of each tick, the hamster checks the four cardinal directions.

- If two or more lights are visible, the hamster faints and the simulation ends.
- If exactly one light is visible, the hamster runs in the opposite direction.
- If no light is visible, the hamster keeps its current direction.
- If no light is visible and the hamster is immobile, the simulation ends immediately.

### Step B: movement

The hamster attempts to move one cell in its current direction.

- If the target cell is inside the grid and not an obstacle, the hamster moves there and the score increases by `1`.
- If the target cell contains a switch, the matching block group toggles.
- If the target cell is outside the grid, is a light, or is an active block, the simulation ends.

## Infinite loops

If the same game state is reached twice, the hamster is considered trapped in an infinite loop.

In that case, the final score is exactly:

```text
0
```

A game state includes:

- The hamster position.
- The current running direction, or immobile state.
- The active/inactive state of all blocks.

## Example

Input file:

```text
10
(2, 2)
L (1, 2) 3
L (2, 6) 1
L (8, 0) 2
B (8, 4) 2 1
B (8, 6) 3 1
B (8, 8) 4 1
S (8, 7) 4
S (8, 5) 3
S (8, 3) 2
L (5, 0) 2
B (5, 1) 1 0
L (6, 5) 1
S (5, 5) 1
L (9, 8) 1
L (1, 9) 3
```

Run:

```bash
cargo run -- input.txt
```

Output:

```text
33
```
