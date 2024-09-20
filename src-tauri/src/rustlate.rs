use async_trait::async_trait;
use reqwest::Client;

pub struct Translator<'a> {
    pub to: &'a str,
    pub from: &'a str,
}
struct Google;

struct Baidu;

#[async_trait]
trait Parse {
    async fn fetch_page(&self, text: &str, from: &str, to: &str) -> Result<String, String>;
    async fn parse_result(&self, result: Result<String, String>) -> Result<String, String>;
}

impl<'a> Translator<'a> {
    pub async fn translate(&self, text: &str, transter: &str) -> Result<String, String> {
        match transter {
            "baidu" => {
                let transtor = Baidu {};
                transtor
                    .parse_result(transtor.fetch_page(text, self.from, self.to).await)
                    .await
            }
            _ => {
                let transtor = Google {};
                transtor
                    .parse_result(transtor.fetch_page(text, self.from, self.to).await)
                    .await
            }
        }
    }
}

#[async_trait]
impl Parse for Google {
    async fn fetch_page(&self, text: &str, from: &str, to: &str) -> Result<String, String> {
        println!("Google.......");
        let client = Client::new();
        let formatted_url = format!(
            "https://translate.google.com/m?tl={}&sl={}&q={}",
            to, from, text
        );

        match client.get(&formatted_url).send().await {
            Ok(response) => match response.text().await {
                Ok(body) => Ok(body),
                Err(err) => Err(err.to_string()),
            },
            Err(err) => Err(err.to_string()),
        }
    }
    async fn parse_result(&self, result: Result<String, String>) -> Result<String, String> {
        match result {
            Ok(body) => {
                // 假设 tl::parse 返回一个 Future，你需要等待这个 Future 完成
                let parsed_body = tl::parse(&body);
                match parsed_body.get_elements_by_class_name("result-container") {
                    Some(element) => Ok(element[0].inner_text().into_owned()),
                    None => Err(String::from("unexpected error")),
                }
            }
            Err(err) => Err(err),
        }
    }
}

#[async_trait]
impl Parse for Baidu {
    async fn fetch_page(&self, text: &str, from: &str, to: &str) -> Result<String, String> {
        println!("Baidu......");
        let client = Client::new();
        let formatted_url = format!(
            "https://fanyi.baidu.com/mtpe-individual/multimodal?lang={}2{}&query={}",
            to, from, text
        );

        match client.get(&formatted_url).send().await {
            Ok(response) => match response.text().await {
                Ok(body) => Ok(body),
                Err(err) => Err(err.to_string()),
            },
            Err(err) => Err(err.to_string()),
        }
    }
    async fn parse_result(&self, result: Result<String, String>) -> Result<String, String> {
        // 以下代码需要根据实际的解析逻辑进行修改
        match result {
            Ok(body) => {
                // 假设 tl::parse 返回一个 Future，你需要等待这个 Future 完成
                let parsed_body = tl::parse(&body);
                println!("{:?}", body);
                match parsed_body.get_elements_by_class_name("result-container") {
                    Some(element) => Ok(element[0].inner_text().into_owned()),
                    None => Err(String::from("unexpected error")),
                }
            }
            Err(err) => Err(err),
        }
    }
}
