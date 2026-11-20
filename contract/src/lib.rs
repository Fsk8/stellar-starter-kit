#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String,
};

/// Claves de almacenamiento. Usar un enum evita errores de tipeo.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Count,
    LastIdea,
}

/// Una idea registrada en el muro.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Idea {
    pub author: Address,
    pub message: String,
}

#[contract]
pub struct BuildLabContract;

#[contractimpl]
impl BuildLabContract {
    /// Guarda una idea asociada al autor.
    /// `usuario.require_auth()` exige que el autor haya firmado esta llamada:
    /// nadie puede publicar en nombre de otra dirección.
    pub fn post_idea(env: Env, usuario: Address, message: String) -> u32 {
        // 1. Autenticación
        usuario.require_auth();

        // 2. Incrementar el contador (instance storage = simple y barato)
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::Count)
            .unwrap_or(0);
        let new_count = count + 1;
        env.storage().instance().set(&DataKey::Count, &new_count);

        // 3. Guardar la última idea
        let idea = Idea {
            author: usuario.clone(),
            message: message.clone(),
        };
        env.storage().instance().set(&DataKey::LastIdea, &idea);

        // 4. Emitir un evento (útil para indexadores y explorers)
        env.events()
            .publish((symbol_short!("idea"), usuario), message);

        new_count
    }

    /// Lee la última idea registrada (None si aún no hay ninguna).
    pub fn get_last_idea(env: Env) -> Option<Idea> {
        env.storage().instance().get(&DataKey::LastIdea)
    }

    /// Total de ideas registradas.
    pub fn get_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::Count)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
