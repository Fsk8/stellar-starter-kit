#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn post_and_read() {
    let env = Env::default();
    env.mock_all_auths();

    let id = env.register(BuildLabContract, ());
    let client = BuildLabContractClient::new(&env, &id);

    let user = Address::generate(&env);

    assert_eq!(client.get_count(), 0);
    assert_eq!(client.get_last_idea(), None);

    let msg = String::from_str(&env, "Mi idea: pagos con QR en Stellar");
    let n = client.post_idea(&user, &msg);

    assert_eq!(n, 1);
    assert_eq!(client.get_count(), 1);

    let last = client.get_last_idea().unwrap();
    assert_eq!(last.author, user);
    assert_eq!(last.message, msg);
}
