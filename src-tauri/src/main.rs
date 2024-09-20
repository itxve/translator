// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use html_escape::decode_html_entities;
use percent_encoding::percent_decode_str;
use serde::Deserialize;
use std::{env, path::PathBuf};
use tauri::AppHandle;
use tauri_plugin_fs::FsExt;
use tauri_plugin_log::{Target, TargetKind};
mod rustlate;

#[tauri::command]
fn run_args() -> (String, String) {
    use std::fs::read_to_string;
    use std::path::Path;
    let mut result = "".to_owned();
    let args: Vec<String> = env::args().collect();
    if args.len() == 2 {
        let path = Path::new(&args[1]);
        let extension = format!(".{}", path.extension().unwrap().to_string_lossy());
        result = read_to_string(path).expect("read error");
        (extension, result)
    } else {
        (result, "".to_owned())
    }
}
#[tauri::command]
fn allow_file(app: AppHandle, path: String) -> String {
    #[cfg(desktop)]
    {
        if let Some(s) = app.try_fs_scope() {
            s.allow_file(PathBuf::from(path.clone()));
            return path;
        }
    }
    "orther".to_owned()
}

#[derive(Deserialize, Debug)]
struct TranslateReq {
    // 定义你的请求体结构
    from: String,
    to: String,
    text: String,
    vm: String,
}
// remember to call `.manage(MyState::default())`
#[tauri::command]
async fn translate(req: TranslateReq) -> String {
    let translator_struct = rustlate::Translator {
        from: &req.from,
        to: &req.to,
    };
    match translator_struct.translate(&req.text, &req.vm).await {
        Ok(translatored) => percent_decode_str(&decode_html_entities(&translatored).to_string())
            .decode_utf8_lossy()
            .to_string(),

        Err(_) => "".to_owned(),
    }
}
use mouse_position::mouse_position::Mouse;

#[tauri::command(async)]
fn mouse_position() -> (i32, i32) {
    let position = Mouse::get_mouse_position();
    match position {
        Mouse::Position { x, y } => (x, y),
        Mouse::Error => {
            println!("Error getting mouse position");
            (0, 0)
        }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir {
                        file_name: Some("debug".to_owned()),
                    }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            run_args,
            translate,
            allow_file,
            mouse_position
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
