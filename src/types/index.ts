interface ServerConfig {
  [key: string]: ConfigItem;
}

let date_format_config = {
  cloums: ["*_time", "*_date"],
  pattern: "YYYY-MM-DD HH:mm:ss",
};
type DateFormatConfig = typeof date_format_config;

let config_template = {
  SERVER: "",
  SQL_REQUEST_KEY: "",
  SQL_SIGN_SECRET: "",
  Platform: "dc/其他",
};
type ConfigItem = typeof config_template;

export type { ServerConfig, ConfigItem, DateFormatConfig };

export { config_template, date_format_config };

export type REQUESTINFO = {
  BASE_NAME: string;
  url: string;
  SQL_REQUEST_KEY: string;
  SQL_SIGN_SECRET: string;
  Platform: string;
};

export type SQL_STATE = {
  sql: string;
  warn: boolean;
};

let OssConfigObject = {
  platform: [{ value: "", label: "", use_app_code_prifix: false }],
  oss_config: [
    {
      storage_code: "test",
      storage_type: 100,
      bucket_name: "",
      end_point: "",
      access_key_id: "",
      access_key_secret: "",
    },
  ],
  oss_map_info: [
    {
      app_code: "test",
      upload_type: "1",
      upload_desc: "",
      storage_type: 100,
      target_base_path: "mall02/admin-",
    },
  ],
};
export type OssUploadMapConfig = typeof OssConfigObject;

export type OssConfig = {
  access_key_id: string;
  access_key_secret: string;
  end_point: string;
  bucket_name: string;
  local_dir_path: string;
  target_base_path: string;
  platform: string;
  storage_code: string;
  ignore_config_js?: boolean;
};

export type UploadInfoType = Record<
  string,
  {
    status: string;
    error: string;
    success_files: string[];
    failed_files: string[];
    total_count: number;
  }
>;
