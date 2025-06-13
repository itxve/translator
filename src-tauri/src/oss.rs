use aliyun_oss_rust_sdk::oss::OSS;
use aliyun_oss_rust_sdk::request::RequestBuilder;
use itertools::Itertools;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path; // 导入itertools

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadInfo {
    pub key_id: String,
    pub key_secret: String,
    pub endpoint: String,
    pub bucket: String,
    pub platform: String,
    pub local_dir_path: String,
    pub target_base_path: String,
    pub ignore_config_js: bool,
}

// 异步函数，递归地获取目录下的所有文件路径

fn get_all_files(dir_path: &Path, first: bool, ignore_config_js: bool) -> Vec<String> {
    let mut result = Vec::new();
    if !dir_path.is_dir() {
        return result;
    }

    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry in entries.filter_map(Result::ok) {
            let path = entry.path();
            if path.is_dir() {
                result.append(&mut get_all_files(&path, false, ignore_config_js));
            } else if let Some(file_path) = path.to_str() {
                if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                    if file_name.starts_with(".") {
                        continue;
                    }
                    if ignore_config_js && first && file_name == "config.js" {
                        continue;
                    }
                    result.push(file_path.to_string());
                }
            }
        }
    }
    result
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadStatus {
    pub success_files: Vec<String>,
    pub failed_files: Vec<String>,
    pub total_count: u32,
}

impl UploadStatus {
    // 创建一个新的 UploadStatus 实例
    fn new() -> Self {
        UploadStatus {
            success_files: Vec::new(),
            failed_files: Vec::new(),
            total_count: 0,
        }
    }

    // 添加成功文件的目录
    fn add_success(&mut self, file_path: String) {
        self.success_files.push(file_path);
    }

    // 添加失败文件的目录
    fn add_failed(&mut self, file_path: String) {
        self.failed_files.push(file_path);
    }

    // 更新总数计数
    fn increment_total(&mut self) {
        self.total_count += 1;
    }

    // 打印当前状态
    fn print_status(&self) {
        println!("Total files: {}", self.total_count);
        println!("Success    files ({}):", self.success_files.len());
        for file in &self.success_files {
            println!("- {}", file);
        }
        println!("Failed files ({}):", self.failed_files.len());
        for file in &self.failed_files {
            println!("- {}", file);
        }
    }
}
// 针对不同平台的实现
trait TargetOssPlatform {
    async fn oss_upload(conf: UploadInfo) -> UploadStatus;
}

pub struct ALIYUNOSS;

impl TargetOssPlatform for ALIYUNOSS {
    async fn oss_upload(conf: UploadInfo) -> UploadStatus {
        println!("aliyu_oss_upload");
        let oss = OSS::new(&conf.key_id, &conf.key_secret, &conf.endpoint, &conf.bucket);
        let dir_path = format!("{}/{}", conf.local_dir_path, conf.platform);
        let dir_path = Path::new(&dir_path);
        let files = get_all_files(dir_path, true, conf.ignore_config_js);
        let mut upload_status = UploadStatus::new();

        for file in &files {
            upload_status.increment_total();
            if let Some(dir_str) = dir_path.to_str() {
                let file_path = file.replace(dir_str, "");
                let oss_path = format!("/{}{}", conf.target_base_path, file_path);

                let rb = mime_guess::from_path(file).first().map_or_else(
                    || RequestBuilder::new().with_expire(60),
                    |mime_type| {
                        RequestBuilder::new()
                            .with_expire(60)
                            .with_content_type(mime_type)
                    },
                );

                match oss.put_object_from_file(&oss_path, file, rb).await {
                    Ok(_) => upload_status.add_success(file.clone()),
                    Err(e) => {
                        eprintln!("Failed to upload {}: {}", file, e);
                        upload_status.add_failed(file.clone());
                    }
                }
            }
        }
        upload_status.print_status();
        upload_status
    }
}

// 列出目录下的所有文件夹
fn list_directories(dir: &Path) -> std::io::Result<Vec<String>> {
    let mut directories = fs::read_dir(dir)?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let path = entry.path();
            if path.is_dir() {
                path.file_name()
                    .and_then(|s| s.to_str())
                    .map(|s| s.to_string())
            } else {
                None
            }
        })
        .collect_vec();
    Ok(directories)
}

#[tauri::command(async)]
pub async fn aliyu_oss_upload(conf: UploadInfo) -> UploadStatus {
    ALIYUNOSS::oss_upload(conf).await
}
#[tauri::command]
pub fn platform_list(dir: &Path) -> Vec<String> {
    list_directories(dir).unwrap_or_default()
}

#[tauri::command]
pub fn exists(dir: &Path) -> bool {
    dir.exists()
}
