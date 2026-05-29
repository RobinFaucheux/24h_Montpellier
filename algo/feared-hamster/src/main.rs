use std::collections::{HashMap, HashSet};
use std::env;
use std::fs;
use std::process;

#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
struct Pos {
    x: usize,
    y: usize,
}

#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
enum Direction {
    North,
    South,
    East,
    West,
}

impl Direction {
    fn delta(self) -> (isize, isize) {
        match self {
            Direction::North => (0, -1),
            Direction::South => (0, 1),
            Direction::East => (1, 0),
            Direction::West => (-1, 0),
        }
    }

    fn opposite(self) -> Self {
        match self {
            Direction::North => Direction::South,
            Direction::South => Direction::North,
            Direction::East => Direction::West,
            Direction::West => Direction::East,
        }
    }
}

#[derive(Clone, Debug)]
struct Light {
    pos: Pos,
    range: usize,
}

#[derive(Clone, Debug)]
struct Block {
    pos: Pos,
    group: usize,
    active: bool,
}

#[derive(Debug)]
struct Game {
    size: usize,
    hamster: Pos,
    lights: Vec<Light>,
    blocks: Vec<Block>,
    // Switches never share a cell with blocks/lights thanks to parse-time
    // occupancy validation, so a position uniquely identifies its group.
    switches: HashMap<Pos, usize>,
}

#[derive(Clone, Debug, Eq, Hash, PartialEq)]
struct State {
    hamster: Pos,
    direction: Option<Direction>,
    blocks: Vec<bool>,
}

#[derive(Clone, Copy, Debug)]
enum ObjectKind {
    Light,
    Block,
    Switch,
}

fn main() {
    let filename = match env::args().nth(1) {
        Some(filename) => filename,
        None => {
            eprintln!("usage: feared-hamster <input-file>");
            process::exit(1);
        }
    };

    let result = fs::read_to_string(&filename)
        .map_err(|err| format!("failed to read {filename}: {err}"))
        .and_then(|contents| parse_game(&contents))
        .map(|mut game| simulate(&mut game));

    match result {
        Ok(score) => println!("{score}"),
        Err(err) => {
            eprintln!("{err}");
            process::exit(1);
        }
    }
}

fn parse_game(input: &str) -> Result<Game, String> {
    // Blank lines are ignored so trailing newlines and visually separated
    // inputs do not affect the strict object-line grammar.
    let mut lines = input.lines().enumerate().filter_map(|(idx, line)| {
        let trimmed = line.trim();
        (!trimmed.is_empty()).then_some((idx + 1, trimmed))
    });

    let (size_line, size_text) = lines
        .next()
        .ok_or_else(|| "missing grid size on line 1".to_string())?;
    let size = size_text
        .parse::<usize>()
        .map_err(|_| format!("line {size_line}: invalid grid size"))?;

    let (hamster_line, hamster_text) = lines
        .next()
        .ok_or_else(|| "missing hamster position on line 2".to_string())?;
    let (hamster, rest) =
        parse_coord_prefix(hamster_text).map_err(|err| format!("line {hamster_line}: {err}"))?;
    if !rest.trim().is_empty() {
        return Err(format!(
            "line {hamster_line}: unexpected text after hamster position"
        ));
    }
    ensure_in_bounds(hamster, size, hamster_line)?;

    let mut occupied: HashMap<Pos, ObjectKind> = HashMap::new();
    let mut lights = Vec::new();
    let mut blocks = Vec::new();
    let mut switches = HashMap::new();

    for (line_no, line) in lines {
        let (kind, rest) = line
            .split_once(char::is_whitespace)
            .ok_or_else(|| format!("line {line_no}: expected object data"))?;
        let (pos, rest) = parse_coord_prefix(rest.trim_start())
            .map_err(|err| format!("line {line_no}: {err}"))?;
        ensure_in_bounds(pos, size, line_no)?;

        // Enforce the central spatial invariant: every object cell is unique,
        // and the hamster does not start on any object.
        if pos == hamster {
            return Err(format!(
                "line {line_no}: object cannot occupy the hamster starting cell ({}, {})",
                pos.x, pos.y
            ));
        }
        if let Some(existing) = occupied.insert(pos, object_kind(kind, line_no)?) {
            return Err(format!(
                "line {line_no}: cell ({}, {}) already contains a {:?}",
                pos.x, pos.y, existing
            ));
        }

        let args: Vec<&str> = rest.split_whitespace().collect();
        match kind {
            "L" => {
                if args.len() != 1 {
                    return Err(format!("line {line_no}: expected format `L (x, y) r`"));
                }
                let range = parse_usize_arg(args[0], line_no, "light range")?;
                lights.push(Light { pos, range });
            }
            "B" => {
                if args.len() != 2 {
                    return Err(format!("line {line_no}: expected format `B (x, y) g s`"));
                }
                let group = parse_group(args[0], line_no)?;
                let active = match args[1] {
                    "0" => false,
                    "1" => true,
                    _ => return Err(format!("line {line_no}: block state must be 0 or 1")),
                };
                blocks.push(Block { pos, group, active });
            }
            "S" => {
                if args.len() != 1 {
                    return Err(format!("line {line_no}: expected format `S (x, y) g`"));
                }
                let group = parse_group(args[0], line_no)?;
                switches.insert(pos, group);
            }
            _ => return Err(format!("line {line_no}: unknown object type `{kind}`")),
        }
    }

    Ok(Game {
        size,
        hamster,
        lights,
        blocks,
        switches,
    })
}

fn object_kind(kind: &str, line_no: usize) -> Result<ObjectKind, String> {
    match kind {
        "L" => Ok(ObjectKind::Light),
        "B" => Ok(ObjectKind::Block),
        "S" => Ok(ObjectKind::Switch),
        _ => Err(format!("line {line_no}: unknown object type `{kind}`")),
    }
}

fn parse_coord_prefix(text: &str) -> Result<(Pos, &str), String> {
    let open = text
        .find('(')
        .ok_or_else(|| "missing `(` in coordinate".to_string())?;
    if !text[..open].trim().is_empty() {
        return Err("unexpected text before coordinate".to_string());
    }
    let close_from_open = text[open + 1..]
        .find(')')
        .ok_or_else(|| "missing `)` in coordinate".to_string())?;
    let close = open + 1 + close_from_open;
    let inside = &text[open + 1..close];
    let (x_text, y_text) = inside
        .split_once(',')
        .ok_or_else(|| "coordinate must contain a comma".to_string())?;
    let x = parse_non_negative_coord(x_text.trim(), "x")?;
    let y = parse_non_negative_coord(y_text.trim(), "y")?;
    Ok((Pos { x, y }, &text[close + 1..]))
}

fn parse_non_negative_coord(text: &str, name: &str) -> Result<usize, String> {
    let value = text
        .parse::<isize>()
        .map_err(|_| format!("invalid {name} coordinate"))?;
    usize::try_from(value).map_err(|_| format!("{name} coordinate cannot be negative"))
}

fn parse_usize_arg(text: &str, line_no: usize, name: &str) -> Result<usize, String> {
    let value = text
        .parse::<isize>()
        .map_err(|_| format!("line {line_no}: invalid {name}"))?;
    usize::try_from(value).map_err(|_| format!("line {line_no}: {name} cannot be negative"))
}

fn parse_group(text: &str, line_no: usize) -> Result<usize, String> {
    let group = parse_usize_arg(text, line_no, "group id")?;
    if group > 5 {
        return Err(format!("line {line_no}: group id must be between 0 and 5"));
    }
    Ok(group)
}

fn ensure_in_bounds(pos: Pos, size: usize, line_no: usize) -> Result<(), String> {
    if pos.x >= size || pos.y >= size {
        Err(format!(
            "line {line_no}: coordinate ({}, {}) is outside the {size}x{size} grid",
            pos.x, pos.y
        ))
    } else {
        Ok(())
    }
}

fn simulate(game: &mut Game) -> u64 {
    let mut score = 0_u64;
    let mut direction = None;
    let mut visited = HashSet::new();

    loop {
        // The whole future is deterministic from this tick-start state. Seeing
        // it twice means the hamster will loop forever, regardless of score.
        let state = State {
            hamster: game.hamster,
            direction,
            blocks: game.blocks.iter().map(|block| block.active).collect(),
        };
        if !visited.insert(state) {
            return 0;
        }

        let visible_lights = visible_light_directions(game);
        match visible_lights.as_slice() {
            [] => {
                // An immobile hamster that sees no light never starts running.
                if direction.is_none() {
                    return score;
                }
            }
            [light_direction] => direction = Some(light_direction.opposite()),
            _ => return score,
        }

        let running_direction = match direction {
            Some(direction) => direction,
            None => return score,
        };

        let Some(target) = offset(game.hamster, running_direction, game.size) else {
            return score;
        };
        if is_obstacle(game, target) {
            return score;
        }

        game.hamster = target;
        score += 1;

        if let Some(&group) = game.switches.get(&target) {
            for block in &mut game.blocks {
                if block.group == group {
                    block.active = !block.active;
                }
            }
        }
    }
}

fn visible_light_directions(game: &Game) -> Vec<Direction> {
    [
        Direction::North,
        Direction::South,
        Direction::East,
        Direction::West,
    ]
    .into_iter()
    .filter(|&direction| visible_light_in_direction(game, direction))
    .collect()
}

fn visible_light_in_direction(game: &Game, direction: Direction) -> bool {
    let mut distance = 1_usize;
    let mut current = game.hamster;

    while let Some(next) = offset(current, direction, game.size) {
        // Active blocks and the first light encountered are line-of-sight
        // blockers. Inactive blocks and switches are transparent.
        if is_active_block(game, next) {
            return false;
        }
        if let Some(light) = game.lights.iter().find(|light| light.pos == next) {
            return distance <= light.range;
        }

        current = next;
        distance += 1;
    }

    false
}

fn offset(pos: Pos, direction: Direction, size: usize) -> Option<Pos> {
    let (dx, dy) = direction.delta();
    let x = pos.x.checked_add_signed(dx)?;
    let y = pos.y.checked_add_signed(dy)?;
    (x < size && y < size).then_some(Pos { x, y })
}

fn is_obstacle(game: &Game, pos: Pos) -> bool {
    game.lights.iter().any(|light| light.pos == pos) || is_active_block(game, pos)
}

fn is_active_block(game: &Game, pos: Pos) -> bool {
    game.blocks
        .iter()
        .any(|block| block.pos == pos && block.active)
}
