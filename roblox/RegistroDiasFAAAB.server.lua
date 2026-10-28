-- FAAAB / Exemplo de integração para ServerScriptService.
-- Ainda NÃO instalado no Roblox Studio. Registro de dias distintos de jogo.
-- Registra apenas acessos recebidos pelo servidor; não prova jogabilidade ativa.
-- A métrica de "dias jogados" deve ser confirmada pela FAAAB antes da ativação eleitoral.
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("FAAAB_ParticipacaoDias_v1")

local function saveVisit(player)
    local userId = player.UserId
    if typeof(userId) ~= "number" or userId <= 0 then return end
    local currentDay = os.date("!%Y-%m-%d")
    local key = "player_" .. tostring(userId)
    local ok, err = pcall(function()
        store:UpdateAsync(key, function(old)
            local record = type(old) == "table" and old or { days = {}, firstVisitUtc = currentDay }
            if type(record.days) ~= "table" then record.days = {} end
            if type(record.firstVisitUtc) ~= "string" then record.firstVisitUtc = currentDay end
            local already = false
            for _, value in ipairs(record.days) do
                if value == currentDay then already = true; break end
            end
            if not already then
                table.insert(record.days, currentDay)
                table.sort(record.days)
            end
            -- Retenção limitada; mais que suficiente para thresholds de 30 e 60.
            while #record.days > 730 do table.remove(record.days, 1) end
            record.lastVisitUtc = currentDay
            return record
        end)
    end)
    if not ok then
        warn("FAAAB: falha ao salvar visita para userId " .. tostring(userId) .. ": " .. tostring(err))
    end
end

Players.PlayerAdded:Connect(saveVisit)
-- Para cruzar este registro com o portal é preciso backend seguro que leia
-- os dados via Roblox Open Cloud. Nunca confie em dias enviados pelo cliente.
